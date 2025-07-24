// src/hooks/useChatSocket.js
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const useChatSocket = (user, userId, setMessages) => {
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false); // Consider if this is still needed or if typingUsers is sufficient
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return; // Ensure user is available before connecting

    const s = io(SOCKET_URL, { transports: ['websocket'] });

    s.on('connect', () => {
      console.log('Socket connected:', s.id);
      s.emit('login', user.id || user._id);
    });

    s.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // --- Message Events ---

    // This listener is primarily for the RECEIVER of the message,
    // or for the SENDER's other open tabs/devices.
    s.on('receive_message', (msg) => {
      console.log('Received message via socket:', msg);

      // Only add if it's relevant to the current chat (sender or receiver is current userId)
      // and it's not a duplicate of a message already processed (e.g., by initial fetch)
      // or already replaced by an optimistic update.
      setMessages((prevMessages) => {
        // Check if a message with this _id (from the server) already exists
        const messageExists = prevMessages.some((m) => m._id === msg._id);

        if (!messageExists) {
          // If the message is new, add it. Mark as delivered for receiver.
          return [...prevMessages, { ...msg, status: 'delivered' }];
        }
        // If it exists, it means it was either fetched initially or already updated by sender's axios response.
        // No action needed for existing messages here to prevent duplicates.
        return prevMessages;
      });

      // Emit read receipt only if the message is for the current user and they are actively viewing the chat
      if (msg.receiver === (user.id || user._id) && msg.sender === userId) {
        s.emit('message_read', { messageId: msg._id, senderId: msg.sender });
      }
    });

    // This listener is primarily for the SENDER's other open tabs/devices.
    // The main sending tab updates its state directly via the axios response.
    s.on('message_sent', (msg) => {
      console.log('Message sent confirmation via socket:', msg);
      // If this is the active chat for the current user and the message is from them,
      // ensure it's in the state.
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some((m) => m._id === msg._id);
        if (!messageExists) {
          // If for some reason it's not there (e.g., initial load race condition), add it.
          return [...prevMessages, { ...msg, status: 'sent' }];
        }
        // If it exists, ensure its status is 'sent' and not 'optimistic'
        return prevMessages.map((m) =>
          m._id === msg._id ? { ...msg, status: 'sent', isOptimistic: false } : m
        );
      });
    });

    // --- Read Receipts ---
    s.on('message_read', ({ messageId, readBy }) => {
      console.log(`Message ${messageId} read by ${readBy}`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, read: true, readBy, status: 'read' } : msg
        )
      );
    });

    // --- Typing Indicators ---
    s.on('typing_start', ({ chatId, userId: typingUserId }) => {
      // Ensure we only track typing for the other user in the current chat
      if (typingUserId === userId) {
        setTypingUsers((prev) => new Set([...prev, typingUserId]));
      }
    });

    s.on('typing_stop', ({ chatId, userId: typingUserId }) => {
      if (typingUserId === userId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(typingUserId);
          return newSet;
        });
      }
    });

    // --- Online/Offline Status ---
    s.on('user_online', (onlineUserId) => {
      console.log(`User online: ${onlineUserId}`);
      setOnlineUsers((prev) => new Set([...prev, onlineUserId]));
    });

    s.on('user_offline', (offlineUserId) => {
      console.log(`User offline: ${offlineUserId}`);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(offlineUserId);
        return newSet;
      });
    });

    setSocket(s);

    // Cleanup function
    return () => {
      console.log('Disconnecting socket...');
      s.emit('logout', user.id || user._id); // Inform server about logout
      s.disconnect();
    };
  }, [user, userId, setMessages]); // Dependencies for useEffect

  return { socket, isTyping, typingUsers, onlineUsers, typingTimeoutRef };
};
