import express from 'express';
import { getProtectedUser } from '../controllers/userController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/protected', auth, getProtectedUser);

export default router; 