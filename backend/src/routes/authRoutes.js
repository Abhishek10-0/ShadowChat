import express from 'express';
import { register, login, googleLogin, getMe } from '../controllers/authController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.get('/me', auth, getMe);

export default router; 