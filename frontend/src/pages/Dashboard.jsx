import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, useSocket } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, PlusCircle, Bell, Settings, MessageCircle, X } from 'lucide-react';

// Helper to format last seen
function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'a while ago';
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  return new Date(lastSeen).toLocaleString();
}

export default function Dashboard() {
  const { token, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentChats, setRecentChats] = useState([]);
  const navigate = useNavigate();

  // New Chat modal state
  const [showModal, setShowModal] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeError, setActiveError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load user info.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchUser();
  }, [token]);

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/chats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Sort by lastMessageTime descending (should already be sorted, but just in case)
        const sorted = [...res.data].sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        setRecentChats(sorted);
      } catch (err) {
        setRecentChats([]);
      }
    };
    if (token) fetchRecentChats();
  }, [token]);

  useSocket(true); // Connect to Socket.IO when on Dashboard

  const handleNewChat = async () => {
    setShowModal(true);
    setActiveLoading(true);
    setActiveError('');
    try {
      const res = await axios.get('http://localhost:3001/api/chats/active-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveUsers(res.data);
    } catch (err) {
      setActiveError(err.response?.data?.error || 'Could not load active users.');
    } finally {
      setActiveLoading(false);
    }
  };

  const handleStartChat = (otherUser) => {
    setShowModal(false);
    localStorage.setItem('selectedChatUser', JSON.stringify(otherUser));
    navigate(`/chat/${otherUser.id || otherUser._id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-white/60 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-2xl overflow-hidden">
            {user && user.profilePic ? (
              <img src={user.profilePic} alt="avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="font-bold text-lg text-gray-800">{user ? user.username : '...'}</div>
            <div className="text-xs text-gray-500">{user ? user.email : ''}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-indigo-100 transition">
            <Bell className="w-5 h-5 text-indigo-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 rounded-full hover:bg-indigo-100 transition">
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 rounded-full hover:bg-pink-100 transition" onClick={logout}>
            <LogOut className="w-5 h-5 text-pink-500" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row gap-8 px-8 py-8">
        {/* Left: Recent Chats */}
        <section className="flex-1 bg-white/60 rounded-2xl shadow-lg p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-500" /> Recent Chats
            </h2>
            <button
              className="flex items-center gap-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-medium transition"
              onClick={handleNewChat}
            >
              <PlusCircle className="w-4 h-4" /> New Chat
            </button>
          </div>
          <ul className="space-y-3 flex-1 overflow-y-auto">
            {recentChats.length === 0 && (
              <li className="text-gray-400 text-center py-8">No recent chats yet.</li>
            )}
            {recentChats.map((chat) => (
              <li
                key={chat._id || chat.id}
                className="flex items-center justify-between bg-white/80 rounded-xl px-4 py-3 shadow hover:shadow-md transition cursor-pointer"
                onClick={() => handleStartChat(chat)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-lg overflow-hidden">
                    {chat.profilePic ? (
                      <img src={chat.profilePic} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">{chat.username}</div>
                    {chat.online ? (
                      <div className="text-xs text-green-500">Online</div>
                    ) : (
                      <div className="text-xs text-gray-400">Last seen {formatLastSeen(chat.lastSeen)}</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Right: Announcements/Info */}
        <aside className="w-full md:w-80 flex-shrink-0 bg-white/60 rounded-2xl shadow-lg p-6 flex flex-col gap-6">
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4 shadow flex flex-col items-center">
            <span className="text-2xl">💬</span>
            <div className="font-semibold text-indigo-600 mt-2">Welcome to ShadowChat!</div>
            <div className="text-xs text-gray-500 text-center mt-1">Your privacy matters. All chats are anonymous and encrypted.</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow flex flex-col gap-2">
            <div className="font-medium text-gray-700">Announcements</div>
            <ul className="text-xs text-gray-500 list-disc list-inside">
              <li>New: Anonymous group chats now available!</li>
              <li>Stay tuned for more features.</li>
            </ul>
          </div>
          {loading && <div className="text-xs text-gray-400 text-center">Loading user info...</div>}
          {error && <div className="text-xs text-pink-500 text-center">{error}</div>}
        </aside>
      </main>

      {/* New Chat Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Start a New Chat</h3>
            {activeLoading && <div className="text-center text-gray-400 py-6">Loading active users...</div>}
            {activeError && <div className="text-center text-pink-500 py-6">{activeError}</div>}
            {!activeLoading && !activeError && (
              <ul className="space-y-3 max-h-64 overflow-y-auto">
                {activeUsers.length === 0 && <li className="text-gray-400 text-center">No active users found.</li>}
                {activeUsers.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 cursor-pointer transition"
                    onClick={() => handleStartChat(u)}
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-lg overflow-hidden">
                      {u.profilePic ? (
                        <img src={u.profilePic} alt="avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">{u.username}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 