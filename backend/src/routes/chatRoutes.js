import express from 'express';
import { getActiveUsers, getRecentChats } from '../controllers/chatController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// This route will need onlineUsers injected from the main server file
let onlineUsersRef = null;
export function setOnlineUsersRef(ref) { onlineUsersRef = ref; }

router.get('/active-users', auth, (req, res) => {
  if (!onlineUsersRef) return res.status(500).json({ error: 'onlineUsers not available' });
  getActiveUsers(req, res, onlineUsersRef);
});

router.get('/chats', auth, getRecentChats);

export { router }; 