import User from '../models/User.js';
import Message from '../models/Message.js';

// Get active users (to be used with onlineUsers map, pass as argument)
export const getActiveUsers = async (req, res, onlineUsers) => {
  try {
    console.log('onlineUsers map:', Array.from(onlineUsers.keys()));
    const onlineIds = Array.from(onlineUsers.keys()).filter(id => id !== req.user);
    console.log('Filtered onlineIds (excluding self):', onlineIds);
    if (onlineIds.length === 0) return res.json([]);
    const users = await User.find({ _id: { $in: onlineIds } }).select('-password');
    // Add online: true and lastSeen for each user
    const result = users.map(u => ({
      ...u.toObject(),
      online: true,
      lastSeen: u.lastSeen
    }));
    console.log('Active users returned:', result.map(u => u.username));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active users', details: err.message });
  }
};

// Get recent chat users (users the current user has chatted with)
export const getRecentChats = async (req, res) => {
  try {
    // Find all messages involving the user, sorted by most recent
    const messages = await Message.find({
      $or: [
        { sender: req.user },
        { receiver: req.user },
      ],
    }).sort({ updatedAt: -1 });

    // Map to store latest message time per user
    const userLastMessageMap = new Map();
    messages.forEach(msg => {
      const otherUserId = msg.sender.toString() === req.user ? msg.receiver.toString() : msg.sender.toString();
      if (!userLastMessageMap.has(otherUserId)) {
        userLastMessageMap.set(otherUserId, msg.updatedAt || msg.timestamp);
      }
    });
    const userIds = Array.from(userLastMessageMap.keys());
    const users = await User.find({ _id: { $in: userIds } }).select('-password');
    const onlineUsers = req.app?.get('onlineUsers') || new Map();
    // Sort users by last message time (descending)
    const result = users.map(u => ({
      ...u.toObject(),
      online: onlineUsers.has(u._id.toString()),
      lastSeen: u.lastSeen,
      lastMessageTime: userLastMessageMap.get(u._id.toString())
    })).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats', details: err.message });
  }
}; 