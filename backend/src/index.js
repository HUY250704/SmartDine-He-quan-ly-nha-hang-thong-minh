import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong from backend' });
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.emit('server-message', { message: 'Connected to SmartDine socket server' });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartdine';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  server.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}).catch((error) => {
  console.error('MongoDB connection error:', error);
  server.listen(port, () => {
    console.log(`Backend running on http://localhost:${port} without DB`);
  });
});
