import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // Optionally decode token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch {
        setUser(null);
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = (jwt) => setToken(jwt);
  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Custom hook for Socket.IO connection and login event
export function useSocket(active) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!active || !user) return;
    const s = io('http://localhost:3001', { transports: ['websocket'] });
    s.on('connect', () => {
      s.emit('login', user.id || user._id);
    });
    socketRef.current = s;
    return () => {
      s.disconnect();
    };
  }, [active, user]);

  return socketRef.current;
} 