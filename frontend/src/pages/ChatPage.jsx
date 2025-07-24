// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import ChatHeader from '../components/chat/ChatHeader';
import ChatSidebar from '../components/chat/ChatSideBar';
import ChatInput from '../components/chat/ChatInput';
import ChatMessage from '../components/chat/ChatMessage';
import { formatLastSeen } from '../utils/formatLastSeen';
import { useFetchRecentChats } from '../hooks/useFetchRecentChats';
import { useFetchMessages } from '../hooks/useFetchMessages';
import { useChatSocket } from '../hooks/useChatSocket';
import { useFetchSelectedUser } from '../hooks/useFetchSelectedUser';

const SOCKET_URL = 'http://localhost:3001';

export default function ChatPage() {
  const { userId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Local state
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Data fetching hooks
  const { recentChats, sidebarLoading, sidebarError } = useFetchRecentChats(token, userId);
  const { messages, setMessages } = useFetchMessages(token, userId);
  const { socket, isTyping, typingUsers, onlineUsers, typingTimeoutRef } = useChatSocket(user, userId, setMessages);
  const { selectedUser } = useFetchSelectedUser(userId, token, recentChats, onlineUsers);

  const messageIdCounter = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if selected user is online
  const isSelectedUserOnline = onlineUsers.has(userId);

  // Handle typing with debounce
  const handleTyping = () => {
    if (!socket || !userId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('typing_start', { to: userId });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { to: userId });
    }, 1000);
  };

  // Handle send message (for text messages)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || !userId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing_stop', { to: userId });
    }

    const messageContent = input.trim();
    setInput('');

    const tempId = `temp_${Date.now()}_${messageIdCounter.current++}`;
    const optimisticMessage = {
      _id: tempId,
      sender: user.id || user._id,
      receiver: userId,
      content: messageContent,
      timestamp: new Date(),
      status: 'sending',
      isOptimistic: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // No need for a setTimeout here to change status to 'sent'
    // The socket 'message_sent' or 'receive_message' will handle final status update

    socket.emit('send_message', {
      to: userId,
      content: messageContent,
    });
  };

  // Handle file change (for image messages)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const tempId = `temp_${Date.now()}_${messageIdCounter.current++}`;
    const optimisticMessage = {
      _id: tempId,
      sender: user.id || user._id,
      receiver: userId,
      content: '[Image]', // Keep this for optimistic text display if image fails
      image: URL.createObjectURL(file), // Use a local URL for immediate display
      timestamp: new Date(),
      status: 'sending',
      isOptimistic: true,
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content', '[Image]'); // Send a placeholder content to backend

      const API_BASE = import.meta.env.VITE_API_BASE_URL;

      const res = await axios.post(`${API_BASE}/api/messages/${userId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const serverMessage = res.data; // This is the full message object from the server

      // Update the optimistic message with the actual server message
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === tempId
            ? { ...serverMessage, status: 'sent', isOptimistic: false }
            : msg
        )
      );

      // Now emit via socket for the receiver
      socket.emit('send_message', {
        to: userId,
        content: serverMessage.content,
        image: serverMessage.image,
        _id: serverMessage._id, // Pass the actual ID from the server
      });

    } catch (err) {
      console.error('Error uploading image:', err);
      // Revert optimistic message status on error
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === tempId
            ? { ...msg, status: 'failed', isOptimistic: false, image: null, content: 'Image upload failed' }
            : msg
        )
      );
      // Using a custom message box instead of alert()
      // alert('Failed to upload image'); // Replace with a proper UI notification
      // Example of a simple console error for user feedback in dev:
      console.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = ''; // Clear the file input
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Sidebar */}
      <ChatSidebar
        recentChats={recentChats}
        sidebarLoading={sidebarLoading}
        sidebarError={sidebarError}
        userId={userId}
        navigate={navigate}
        onlineUsers={onlineUsers}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <ChatHeader selectedUser={selectedUser} isSelectedUserOnline={isSelectedUserOnline} formatLastSeen={formatLastSeen} />

        {/* Messages Area */}
        <main className="flex-1 flex flex-col px-2 py-4 overflow-y-auto">
          <div className="flex flex-col gap-2 max-w-2xl mx-auto w-full">
            {messages.map((msg) => (
              <ChatMessage key={msg._id || msg.id} msg={msg} user={user} />
            ))}

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex justify-start">
                <div className="bg-white/90 text-gray-800 rounded-bl-md rounded-2xl px-4 py-2 max-w-xs shadow text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">typing</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Message Input */}
        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          handleTyping={handleTyping}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          uploading={uploading}
          sending={sending}
        />
      </div>
    </div>
  );
}
