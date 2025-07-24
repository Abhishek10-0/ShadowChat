// src/routes/messageRoutes.js
import express from 'express';
import { sendMessage, getMessages } from '../controllers/messageController.js';
import  protect  from '../middlewares/auth.js'; // Assuming you have an auth middleware for user protection
import upload from '../middlewares/multer.js'; // Import your multer middleware

const router = express.Router();

// /**
//  * @route POST /api/messages/:userId
//  * @description Send a new message to a specific user, with optional file upload.
//  * @access Private
//  * @middleware protect - Ensures the user is authenticated.
//  * @middleware upload.single('file') - Handles multipart/form-data for a single file named 'file'.
//  * This populates req.file with file information.
//  */
router.post('/:userId', protect, upload.single('file'), sendMessage);

// /**
//  * @route GET /api/messages/:userId
//  * @description Get all messages between the current user and a specific user.
//  * @access Private
//  * @middleware protect - Ensures the user is authenticated.
//  */
router.get('/:userId', protect, getMessages);

export default router;
