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

// In-memory active user tracking
const activeUsers = new Map(); // userId -> { username, email, profilePic }

function addActiveUser(user) {
  activeUsers.set(user.id, {
    id: user.id,
    username: user.username,
    email: user.email,
    profilePic: user.profilePic || '',
  });
}
function removeActiveUser(userId) {
  activeUsers.delete(userId);
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
    addActiveUser({ id: user._id.toString(), username: user.username, email: user.email, profilePic: user.profilePic });
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
    addActiveUser({ id: user._id.toString(), username: user.username, email: user.email, profilePic: user.profilePic });
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
    addActiveUser({ id: user._id.toString(), username: user.username, email: user.email, profilePic: user.profilePic });
    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google ID token', details: err.message });
  }
});

// List active users (except the requester)
app.get('/active-users', auth, (req, res) => {
  const users = Array.from(activeUsers.values()).filter(u => u.id !== req.user);
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 