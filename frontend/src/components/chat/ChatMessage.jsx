import React from 'react';
import { User } from 'lucide-react';

export default function ChatMessage({ msg, user }) {
  console.log('ChatMessage received msg:', msg);
  
  return (
    <div className={`flex ${msg.sender === (user.id || user._id) ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-4 py-2 max-w-xs break-words shadow text-sm ${
          msg.sender === (user.id || user._id)
            ? 'bg-indigo-500 text-white rounded-br-md'
            : 'bg-white/90 text-gray-800 rounded-bl-md'
        }`}
      >
        {msg.type === 'image' ? (
          <img src={msg.content} alt="sent" className="max-w-[200px] max-h-[200px] rounded-lg" />
        ) : msg.type === 'file' ? (
          <a href={msg.content} target="_blank" rel="noopener noreferrer" className="underline text-xs">
            {msg.originalname || 'File'}
          </a>
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
  );
}
