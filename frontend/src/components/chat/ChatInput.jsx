import React from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  handleSend,
  handleTyping,
  fileInputRef,
  handleFileChange,
  uploading,
  sending,
}) {
  return (
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
  );
}