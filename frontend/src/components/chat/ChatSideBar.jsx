import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';

export default function ChatSidebar({ recentChats, sidebarLoading, sidebarError, userId, navigate, onlineUsers }) {
  return (
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
  );
}