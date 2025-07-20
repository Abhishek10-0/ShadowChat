import Message from '../models/Message.js';
import User from '../models/User.js';

// Track typing users: { chatId: Set of typing user IDs }
const typingUsers = new Map();
// Track message read status: { messageId: Set of user IDs who read it }
const messageReadStatus = new Map();

// Helper functions for typing indicators
function getChatId(user1, user2) {
  return [user1, user2].sort().join('-');
}

function addTypingUser(chatId, userId) {
  if (!typingUsers.has(chatId)) {
    typingUsers.set(chatId, new Set());
  }
  typingUsers.get(chatId).add(userId);
}

function removeTypingUser(chatId, userId) {
  if (typingUsers.has(chatId)) {
    typingUsers.get(chatId).delete(userId);
    if (typingUsers.get(chatId).size === 0) {
      typingUsers.delete(chatId);
    }
  }
}

const setupSocket = (io, onlineUsers) => {
  io.on('connection', (socket) => {
    // Authenticate user on connection
    socket.on('login', async (userId) => {
      onlineUsers.set(userId, socket); // Update socket reference
      socket.userId = userId;
      // Set lastSeen to null (or now) to indicate online
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: null });
      } catch (err) {
        console.error('Error updating lastSeen on connect:', err);
      }
      // Broadcast online status to all users
      socket.broadcast.emit('user_online', userId);
    });

    // Handle sending a message
    socket.on('send_message', async ({ to, content }) => {
      if (!socket.userId || !to || !content) return;
      try {
        const message = new Message({
          sender: socket.userId,
          receiver: to,
          content,
        });
        await message.save();
        
        const chatId = getChatId(socket.userId, to);
        // Remove typing indicator when message is sent
        removeTypingUser(chatId, socket.userId);
        
        const messageData = {
          _id: message._id,
          sender: socket.userId,
          receiver: to,
          content,
          timestamp: message.timestamp,
          read: false,
        };
        
        // Emit to receiver if online
        const receiverSocket = onlineUsers.get(to);
        if (receiverSocket) {
          receiverSocket.emit('receive_message', messageData);
          // Emit typing stop to sender
          socket.emit('typing_stop', { chatId, userId: socket.userId });
        }
        // Also emit to sender for confirmation
        socket.emit('message_sent', messageData);
      } catch (err) {
        socket.emit('error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', ({ to }) => {
      if (!socket.userId || !to) return;
      const chatId = getChatId(socket.userId, to);
      addTypingUser(chatId, socket.userId);
      
      // Emit to the other user
      const receiverSocket = onlineUsers.get(to);
      if (receiverSocket) {
        receiverSocket.emit('typing_start', { chatId, userId: socket.userId });
      }
    });

    socket.on('typing_stop', ({ to }) => {
      if (!socket.userId || !to) return;
      const chatId = getChatId(socket.userId, to);
      removeTypingUser(chatId, socket.userId);
      
      // Emit to the other user
      const receiverSocket = onlineUsers.get(to);
      if (receiverSocket) {
        receiverSocket.emit('typing_stop', { chatId, userId: socket.userId });
      }
    });

    // Handle message read receipts
    socket.on('message_read', ({ messageId, senderId }) => {
      if (!socket.userId) return;
      
      // Track read status
      if (!messageReadStatus.has(messageId)) {
        messageReadStatus.set(messageId, new Set());
      }
      messageReadStatus.get(messageId).add(socket.userId);
      
      // Notify sender that message was read
      const senderSocket = onlineUsers.get(senderId);
      if (senderSocket) {
        senderSocket.emit('message_read', { messageId, readBy: socket.userId });
      }
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        // Update lastSeen to now
        try {
          await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
        } catch (err) {
          console.error('Error updating lastSeen on disconnect:', err);
        }
        // Broadcast offline status
        socket.broadcast.emit('user_offline', socket.userId);
      }
    });
  });
};

export default setupSocket; 