import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/:userId', auth, getMessages);
router.post('/:userId', auth, sendMessage);

export default router; 