import Message from '../models/Message.js';
import { cloudinary } from '../utils/cloudinary.js';

// Send message with optional image upload to Cloudinary
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.user?._id || req.user?.id; // ✅ double-check presence

    let content = req.body.content?.trim() || '';
     let imageUrl = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'auto',
        folder: 'chat_files',
      });
      imageUrl = result.secure_url; // ✅ Yeh line zaroori hai
    }


    // ✅ If both content and image are missing, return error
    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Message must have content or image' });
    }

    // ✅ Force non-empty content for validation, if image exists
    if (!content && imageUrl) {
      content = '[Image]';
    }

    const newMessage = new Message({
      content,
      sender: senderId,
      receiver: userId,
      image: imageUrl,
    });

    console.log('Message object to be saved:', newMessage);

    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



export const getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
};
