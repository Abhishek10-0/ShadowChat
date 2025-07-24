import { useState, useEffect } from 'react';
import axios from 'axios';

export const useFetchMessages = (token, userId) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`http://localhost:3001/api/messages/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        setMessages([]);
      }
    };
    if (token && userId) fetchMessages();
  }, [token, userId]);

  return { messages, setMessages };
};
