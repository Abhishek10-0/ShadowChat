import User from '../models/User.js';
import Message from '../models/Message.js';

// Get active users (to be used with onlineUsers map, pass as argument)
export const getActiveUsers = async (req, res, onlineUsers) => {
  try {
    const onlineIds = Array.from(onlineUsers.keys()).filter(id => id !== req.user);
    if (onlineIds.length === 0) return res.json([]);
    const users = await User.find({ _id: { $in: onlineIds } }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active users', details: err.message });
  }
};

// Get recent chat users (users the current user has chatted with)
export const getRecentChats = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user },
        { receiver: req.user },
      ],
    }).sort({ updatedAt: -1 });
    const userIds = new Set();
    messages.forEach(msg => {
      if (msg.sender.toString() !== req.user) userIds.add(msg.sender.toString());
      if (msg.receiver.toString() !== req.user) userIds.add(msg.receiver.toString());
    });
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats', details: err.message });
  }
}; 