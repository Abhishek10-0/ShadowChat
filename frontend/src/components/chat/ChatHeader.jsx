import React from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function ChatHeader({ selectedUser, isSelectedUserOnline, formatLastSeen }) {
  return (
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
        {selectedUser.online ? (
          <span className="text-xs text-green-500">Online</span>
        ) : (
          <span className="text-xs text-gray-400">Last seen {formatLastSeen(selectedUser.lastSeen)}</span>
        )}
      </div>
    </header>
  );
}