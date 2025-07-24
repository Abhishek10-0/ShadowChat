import { useState, useEffect } from 'react';
import axios from 'axios';

export const useFetchSelectedUser = (userId, token, recentChats, onlineUsers) => {
  const [selectedUser, setSelectedUser] = useState({
    username: 'Loading...',
    profilePic: '',
    online: false,
  });

  useEffect(() => {
    const fetchSelectedUser = async () => {
      if (!userId || !token) return;

      const storedUser = localStorage.getItem('selectedChatUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.id === userId || parsedUser._id === userId) {
            setSelectedUser({
              ...parsedUser,
              online: onlineUsers.has(userId),
            });
            localStorage.removeItem('selectedChatUser');
            return;
          }
        } catch (err) {
          console.error('Failed to parse stored user:', err);
        }
      }

      const foundInChats = recentChats.find(u => u._id === userId || u.id === userId);
      if (foundInChats) {
        setSelectedUser({
          ...foundInChats,
          online: onlineUsers.has(userId),
        });
        return;
      }

      try {
        const res = await axios.get('http://localhost:3001/api/chats/active-users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const activeUsers = res.data;
        const foundInActive = activeUsers.find(u => u._id === userId || u.id === userId);
        if (foundInActive) {
          setSelectedUser({
            ...foundInActive,
            online: onlineUsers.has(userId),
          });
          return;
        }
      } catch (err) {
        console.error('Failed to fetch active users:', err);
      }

      setSelectedUser({
        username: 'Unknown User',
        email: '',
        profilePic: '',
        online: onlineUsers.has(userId),
      });
    };

    fetchSelectedUser();
  }, [userId, token, recentChats, onlineUsers]);

  return { selectedUser };
};