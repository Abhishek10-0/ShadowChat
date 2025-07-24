import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const useChatSocket = (user, userId, setMessages) => {
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const s = io(SOCKET_URL, { transports: ['websocket'] });

    s.on('connect', () => {
      s.emit('login', user.id || user._id);
    });

    // Message events
    s.on('receive_message', (msg) => {
      if (msg.sender === userId || msg.receiver === userId) {
        setMessages((prev) => {
          const hasOptimistic = prev.some(m =>
            m.isOptimistic &&
            m.content === msg.content &&
            m.sender === msg.sender &&
            m.receiver === msg.receiver
          );

          if (hasOptimistic) {
            return prev.map((message) => {
              if (message.isOptimistic &&
                  message.content === msg.content &&
                  message.sender === msg.sender &&
                  message.receiver === msg.receiver) {
                return { ...msg, status: 'sent', isOptimistic: false };
              }
              return message;
            });
          } else {
            return [...prev, { ...msg, status: 'delivered' }];
          }
        });

        s.emit('message_read', { messageId: msg._id, senderId: msg.sender });
      }
    });

    s.on('message_sent', (msg) => {
      if (msg.receiver === userId) return;

      setMessages((prev) =>
        prev.map((message) => {
          if (message.isOptimistic &&
              message.content === msg.content &&
              message.sender === msg.sender &&
              message.receiver === msg.receiver) {
            return { ...msg, status: 'sent', isOptimistic: false };
          }
          return message;
        })
      );
    });

    // Read receipts
    s.on('message_read', ({ messageId, readBy }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, read: true, readBy, status: 'read' } : msg
        )
      );
    });

    // Typing indicators
    s.on('typing_start', ({ chatId, userId: typingUserId }) => {
      if (typingUserId !== (user.id || user._id)) {
        setTypingUsers((prev) => new Set([...prev, typingUserId]));
      }
    });

    s.on('typing_stop', ({ chatId, userId: typingUserId }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(typingUserId);
        return newSet;
      });
    });

    // Online/offline status
    s.on('user_online', (userId) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
      if (userId === window.location.pathname.split('/').pop()) {
        // You might need to pass setSelectedUser down if you want to update it here
      }
    });

    s.on('user_offline', (userId) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      if (userId === window.location.pathname.split('/').pop()) {
        // You might need to pass setSelectedUser down if you want to update it here
      }
    });

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [user, userId, setMessages]);

  return { socket, isTyping, typingUsers, onlineUsers, typingTimeoutRef };
};