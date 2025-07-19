require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 3001;
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const cors = require('cors');
const Message = require('./models/Message');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());

// Remove old activeUsers logic (delete all addActiveUser, removeActiveUser, and activeUsers references)

// Map of userId to socket
const onlineUsers = new Map();
// Track typing users: { chatId: Set of typing user IDs }
const typingUsers = new Map();
// Track message read status: { messageId: Set of user IDs who read it }
const messageReadStatus = new Map();

// Add users to onlineUsers when they log in/register
function addOnlineUser(userId) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, null); // null socket for now, will be set when they connect via Socket.IO
    console.log(`Added user ${userId} to onlineUsers. Total online: ${onlineUsers.size}`);
  }
}

function removeOnlineUser(userId) {
  onlineUsers.delete(userId);
  console.log(`Removed user ${userId} from onlineUsers. Total online: ${onlineUsers.size}`);
}

// Helper functions for typing indicators
function getChatId(user1, user2) {
  return [user1, user2].sort().join('-');
}

function addTypingUser(chatId, userId) {
  if (!typingUsers.has(chatId)) {
    typingUsers.set(chatId, new Set());
  }
  typingUsers.get(chatId).add(userId);
}

function removeTypingUser(chatId, userId) {
  if (typingUsers.has(chatId)) {
    typingUsers.get(chatId).delete(userId);
    if (typingUsers.get(chatId).size === 0) {
      typingUsers.delete(chatId);
    }
  }
}

app.post('/register', async (req, res) => {
  try {
    const { username, email, password, profilePic } = req.body;
    const user = new User({ username, email, password, profilePic });
    await user.save();
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1d' }
    );
    addOnlineUser(user._id.toString());
    res.status(201).json({ token });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isMatch = await require('bcrypt').compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1d' }
    );
    addOnlineUser(user._id.toString());
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

app.get('/protected', auth, (req, res) => {
  res.json({ userId: req.user });
});

app.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
});

app.post('/google-login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'No ID token provided' });
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name || email.split('@')[0],
        email,
        password: sub, // Not used, but required by schema
        profilePic: picture,
      });
      await user.save();
    }
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1d' }
    );
    addOnlineUser(user._id.toString());
    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google ID token', details: err.message });
  }
});

// List active users (except the requester) using onlineUsers from Socket.IO
app.get('/active-users', auth, async (req, res) => {
  try {
    console.log(`/active-users called by user ${req.user}`);
    console.log(`onlineUsers size: ${onlineUsers.size}`);
    console.log(`onlineUsers keys: ${Array.from(onlineUsers.keys())}`);
    const onlineIds = Array.from(onlineUsers.keys()).filter(id => id !== req.user);
    console.log(`Filtered onlineIds: ${onlineIds}`);
    if (onlineIds.length === 0) {
      console.log('No online users found, returning empty array');
      return res.json([]);
    }
    const users = await User.find({ _id: { $in: onlineIds } }).select('-password');
    console.log(`Found ${users.length} users in database`);
    res.json(users);
  } catch (err) {
    console.error('Error in /active-users:', err);
    res.status(500).json({ error: 'Failed to fetch active users', details: err.message });
  }
});

// Get recent chat users (users the current user has chatted with)
app.get('/chats', auth, async (req, res) => {
  try {
    // Find all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: req.user },
        { receiver: req.user },
      ],
    }).sort({ updatedAt: -1 });

    // Get unique user IDs (other than self)
    const userIds = new Set();
    messages.forEach(msg => {
      if (msg.sender.toString() !== req.user) userIds.add(msg.sender.toString());
      if (msg.receiver.toString() !== req.user) userIds.add(msg.receiver.toString());
    });

    // Fetch user details
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats', details: err.message });
  }
});

// Get all messages between current user and another user
app.get('/messages/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.user, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user },
      ],
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
});

// Send a new message to another user
app.post('/messages/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content required' });
    const message = new Message({
      sender: req.user,
      receiver: otherUserId,
      content,
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload endpoint
app.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, originalname: req.file.originalname, mimetype: req.file.mimetype });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  // Authenticate user on connection
  socket.on('login', (userId) => {
    onlineUsers.set(userId, socket); // Update socket reference
    socket.userId = userId;
    // Broadcast online status to all users
    socket.broadcast.emit('user_online', userId);
  });

  // Handle sending a message
  socket.on('send_message', async ({ to, content }) => {
    if (!socket.userId || !to || !content) return;
    try {
      const message = new Message({
        sender: socket.userId,
        receiver: to,
        content,
      });
      await message.save();
      
      const chatId = getChatId(socket.userId, to);
      // Remove typing indicator when message is sent
      removeTypingUser(chatId, socket.userId);
      
      const messageData = {
        _id: message._id,
        sender: socket.userId,
        receiver: to,
        content,
        timestamp: message.timestamp,
        read: false,
      };
      
      // Emit to receiver if online
      const receiverSocket = onlineUsers.get(to);
      if (receiverSocket) {
        receiverSocket.emit('receive_message', messageData);
        // Emit typing stop to sender
        socket.emit('typing_stop', { chatId, userId: socket.userId });
      }
      // Also emit to sender for confirmation
      socket.emit('message_sent', messageData);
    } catch (err) {
      socket.emit('error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', ({ to }) => {
    if (!socket.userId || !to) return;
    const chatId = getChatId(socket.userId, to);
    addTypingUser(chatId, socket.userId);
    
    // Emit to the other user
    const receiverSocket = onlineUsers.get(to);
    if (receiverSocket) {
      receiverSocket.emit('typing_start', { chatId, userId: socket.userId });
    }
  });

  socket.on('typing_stop', ({ to }) => {
    if (!socket.userId || !to) return;
    const chatId = getChatId(socket.userId, to);
    removeTypingUser(chatId, socket.userId);
    
    // Emit to the other user
    const receiverSocket = onlineUsers.get(to);
    if (receiverSocket) {
      receiverSocket.emit('typing_stop', { chatId, userId: socket.userId });
    }
  });

  // Handle message read receipts
  socket.on('message_read', ({ messageId, senderId }) => {
    if (!socket.userId) return;
    
    // Track read status
    if (!messageReadStatus.has(messageId)) {
      messageReadStatus.set(messageId, new Set());
    }
    messageReadStatus.get(messageId).add(socket.userId);
    
    // Notify sender that message was read
    const senderSocket = onlineUsers.get(senderId);
    if (senderSocket) {
      senderSocket.emit('message_read', { messageId, readBy: socket.userId });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      // Broadcast offline status
      socket.broadcast.emit('user_offline', socket.userId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 