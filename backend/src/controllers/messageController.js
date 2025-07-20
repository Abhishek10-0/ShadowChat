import Message from '../models/Message.js';

// Get all messages between current user and another user
export const getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.user, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user },
      ],
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
};

// Send a new message to another user
export const sendMessage = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content required' });
    const message = new Message({
      sender: req.user,
      receiver: otherUserId,
      content,
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
}; 