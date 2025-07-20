import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, User, Send, Image as ImageIcon, X } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export default function Chat() {
  const { userId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Sidebar state
  const [recentChats, setRecentChats] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [sidebarError, setSidebarError] = useState('');

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Real-time features
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Selected user state
  const [selectedUser, setSelectedUser] = useState({
    username: 'Loading...',
    profilePic: '',
    online: false,
  });

  // Socket state
  const [socket, setSocket] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageIdCounter = useRef(0);

  // Handle image/file upload
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Fetch recent chats
  useEffect(() => {
    const fetchChats = async () => {
      setSidebarLoading(true);
      setSidebarError('');
      try {
        const res = await fetch('http://localhost:3001/chats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch chats');
        const data = await res.json();
        setRecentChats(data);
      } catch (err) {
        setSidebarError('Could not load chats.');
      } finally {
        setSidebarLoading(false);
      }
    };
    if (token) fetchChats();
  }, [token, userId]);

  // Fetch selected user details
  useEffect(() => {
    const fetchSelectedUser = async () => {
      if (!userId || !token) return;
      
      // First check if we have user details in localStorage (from New Chat modal)
      const storedUser = localStorage.getItem('selectedChatUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.id === userId || parsedUser._id === userId) {
            setSelectedUser({
              ...parsedUser,
              online: onlineUsers.has(userId),
            });
            // Clear localStorage after using it
            localStorage.removeItem('selectedChatUser');
            return;
          }
        } catch (err) {
          console.error('Failed to parse stored user:', err);
        }
      }
      
      // First try to find in recent chats
      const foundInChats = recentChats.find(u => u._id === userId || u.id === userId);
      if (foundInChats) {
        setSelectedUser({
          ...foundInChats,
          online: onlineUsers.has(userId),
        });
        return;
      }

      // If not in recent chats, try to fetch from active users
      try {
        const res = await fetch('http://localhost:3001/active-users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const activeUsers = await res.json();
          const foundInActive = activeUsers.find(u => u._id === userId || u.id === userId);
          if (foundInActive) {
            setSelectedUser({
              ...foundInActive,
              online: onlineUsers.has(userId),
            });
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch active users:', err);
      }

      // If still not found, set a default
      setSelectedUser({
        username: 'Unknown User',
        email: '',
        profilePic: '',
        online: onlineUsers.has(userId),
      });
    };

    fetchSelectedUser();
  }, [userId, token, recentChats, onlineUsers]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`http://localhost:3001/messages/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        setMessages([]);
      }
    };
    if (token && userId) fetchMessages();
  }, [token, userId]);

  // Socket.IO setup with enhanced features
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
          // Check if we have an optimistic message that should be replaced
          const hasOptimistic = prev.some(m => 
            m.isOptimistic && 
            m.content === msg.content && 
            m.sender === msg.sender &&
            m.receiver === msg.receiver
          );
          
          if (hasOptimistic) {
            // Replace optimistic message with real message
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
            // Add new message from other user
            return [...prev, { ...msg, status: 'delivered' }];
          }
        });
        
        // Mark message as read
        s.emit('message_read', { messageId: msg._id, senderId: msg.sender });
      }
    });

    s.on('message_sent', (msg) => {
      if (msg.receiver === userId) return; // already handled by receive_message
      
      // Update optimistic message with real message data
      setMessages((prev) => 
        prev.map((message) => {
          // Find the optimistic message that matches this content and sender
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
      // Update selected user online status if it's the current chat user
      if (userId === window.location.pathname.split('/').pop()) {
        setSelectedUser(prev => ({ ...prev, online: true }));
      }
    });

    s.on('user_offline', (userId) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      // Update selected user online status if it's the current chat user
      if (userId === window.location.pathname.split('/').pop()) {
        setSelectedUser(prev => ({ ...prev, online: false }));
      }
    });

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [user, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if selected user is online
  const isSelectedUserOnline = onlineUsers.has(userId);

  // Handle typing with debounce
  const handleTyping = () => {
    if (!socket || !userId) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing start
    socket.emit('typing_start', { to: userId });

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { to: userId });
    }, 1000);
  };

  // Send message handler with optimistic updates
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || !userId) return;
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing_stop', { to: userId });
    }
    
    const messageContent = input.trim();
    setInput('');
    
    // Create optimistic message
    const tempId = `temp_${Date.now()}_${messageIdCounter.current++}`;
    const optimisticMessage = {
      _id: tempId,
      sender: user.id || user._id,
      receiver: userId,
      content: messageContent,
      timestamp: new Date(),
      status: 'sending', // sending, sent, delivered, read, error
      isOptimistic: true,
    };
    
    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Set timeout to update status to 'sent' if no server response
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId && msg.status === 'sending'
            ? { ...msg, status: 'sent', isOptimistic: false }
            : msg
        )
      );
    }, 3000); // 3 seconds timeout
    
    // Send via socket
    socket.emit('send_message', {
      to: userId,
      content: messageContent,
    });
  };

  // Handle image/file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // Send the image as a message (special type)
        socket.emit('send_message', {
          to: userId,
          content: data.url,
          type: data.mimetype.startsWith('image/') ? 'image' : 'file',
          originalname: data.originalname,
        });
      }
    } catch (err) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white/80 border-r border-gray-100 flex flex-col py-4 px-2 min-h-screen">
        <div className="flex items-center gap-2 mb-6 px-2">
          <Link to="/dashboard" className="p-2 rounded-full hover:bg-indigo-100 transition">
            <ArrowLeft className="w-5 h-5 text-indigo-500" />
          </Link>
          <span className="font-bold text-lg text-gray-800">Chats</span>
        </div>
        {sidebarLoading && <div className="text-gray-400 text-center py-8">Loading chats...</div>}
        {sidebarError && <div className="text-pink-500 text-center py-8">{sidebarError}</div>}
        <ul className="flex-1 overflow-y-auto space-y-1">
          {recentChats.length === 0 && !sidebarLoading && !sidebarError && (
            <li className="text-gray-400 text-center py-8">No recent chats</li>
          )}
          {recentChats.map(u => (
            <li
              key={u._id || u.id}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${(u._id || u.id) === userId ? 'bg-indigo-100' : 'hover:bg-indigo-50'}`}
              onClick={() => navigate(`/chat/${u._id || u.id}`)}
            >
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-lg overflow-hidden relative">
                {u.profilePic ? (
                  <img src={u.profilePic} alt="avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                {/* Online indicator */}
                {onlineUsers.has(u._id || u.id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-700">{u.username}</div>
                <div className="text-xs text-gray-500 truncate">{u.email}</div>
              </div>
              {(u._id || u.id) === userId && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white/80 shadow-md sticky top-0 z-20">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-lg overflow-hidden relative">
            {selectedUser.profilePic ? (
              <img src={selectedUser.profilePic} alt="avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
            {/* Online indicator */}
            {isSelectedUserOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 leading-tight">{selectedUser.username}</span>
            <span className={`text-xs ${isSelectedUserOnline ? 'text-green-500' : 'text-gray-400'}`}>
              {isSelectedUserOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 flex flex-col px-2 py-4 overflow-y-auto">
          <div className="flex flex-col gap-2 max-w-2xl mx-auto w-full">
            {messages.map((msg) => (
              <div
                key={msg._id || msg.id}
                className={`flex ${msg.sender === (user.id || user._id) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 max-w-xs break-words shadow text-sm ${
                    msg.sender === (user.id || user._id)
                      ? 'bg-indigo-500 text-white rounded-br-md'
                      : 'bg-white/90 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.type === 'image' ? (
                    <img src={`http://localhost:3001${msg.content}`} alt="sent" className="max-w-[200px] max-h-[200px] rounded-lg" />
                  ) : msg.type === 'file' ? (
                    <a href={`http://localhost:3001${msg.content}`} target="_blank" rel="noopener noreferrer" className="underline text-xs">{msg.originalname || 'File'}</a>
                  ) : (
                    msg.content
                  )}
                  <div className="text-[10px] text-right text-gray-400 mt-1 flex items-center gap-1 justify-end">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    {msg.sender === (user.id || user._id) && (
                      <span className="flex items-center gap-1">
                        {msg.status === 'sending' && (
                          <span className="text-gray-400 animate-pulse">⏳</span>
                        )}
                        {msg.status === 'sent' && (
                          <span className="text-gray-400">✓</span>
                        )}
                        {msg.status === 'delivered' && (
                          <span className="text-gray-400">✓✓</span>
                        )}
                        {msg.status === 'read' && (
                          <span className="text-blue-400">✓✓</span>
                        )}
                        {msg.read && (
                          <span className="text-blue-400">✓✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
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
        <form className="flex items-center gap-2 px-4 py-3 bg-white/80 shadow-inner sticky bottom-0 z-20" onSubmit={handleSend}>
          <button
            type="button"
            className="p-2 rounded-full bg-gray-100 hover:bg-indigo-100 text-indigo-500 transition flex items-center justify-center"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploading}
            title="Send image or file"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="file"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            disabled={sending}
            autoFocus
          />
          <button
            type="submit"
            className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition flex items-center justify-center"
            disabled={sending || !input.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 