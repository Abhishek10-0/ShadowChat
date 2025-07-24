import { useState, useEffect } from 'react';
import axios from 'axios';

export const useFetchRecentChats = (token, userId) => {
  const [recentChats, setRecentChats] = useState([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [sidebarError, setSidebarError] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      setSidebarLoading(true);
      setSidebarError('');
      try {
        const res = await axios.get('http://localhost:3001/api/chats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecentChats(res.data);
      } catch (err) {
        setSidebarError(err.response?.data?.error || 'Could not load chats.');
      } finally {
        setSidebarLoading(false);
      }
    };
    if (token) fetchChats();
  }, [token, userId]);

  return { recentChats, sidebarLoading, sidebarError };
};