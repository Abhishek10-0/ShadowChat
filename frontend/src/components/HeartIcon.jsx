import React from 'react';

export default function HeartIcon({ className = 'w-16 h-16 mb-4' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
        <defs>
          <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6aab" />
            <stop offset="100%" stopColor="#7f6aff" />
          </linearGradient>
        </defs>
        <path d="M32 58s-22-13.6-22-30A12 12 0 0 1 32 14a12 12 0 0 1 22 14c0 16.4-22 30-22 30z" fill="url(#heartGradient)"/>
        <path d="M32 56.2S12 43.6 12 28A10 10 0 0 1 32 18a10 10 0 0 1 20 10c0 15.6-20 28.2-20 28.2z" fill="none" stroke="#fff" strokeWidth="2"/>
      </svg>
    </div>
  );
} 