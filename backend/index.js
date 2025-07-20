import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import app, { setOnlineUsersRef } from './src/app.js';
import setupSocket from './src/utils/socket.js';

const PORT = 3001;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

// Map of userId to socket for real-time features
const onlineUsers = new Map();
setOnlineUsersRef(onlineUsers); // Inject into chat routes
setupSocket(io, onlineUsers);

// TODO: Move Socket.IO/chat logic to a separate file/module
// io.on('connection', ...)

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 