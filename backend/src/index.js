import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';

// Register all models
import './models/index.js';

// Routes
import authRoutes from './routes/auth.js';
import tableRoutes from './routes/tables.js';
import categoryRoutes from './routes/categories.js';
import menuRoutes from './routes/menu.js';
import sessionRoutes from './routes/sessions.js';
import billRoutes from './routes/bills.js';
import orderRoutes from './routes/orders.js';
import supportRoutes from './routes/support.js';
import dashboardRoutes from './routes/dashboard.js';

// Socket
import { initSocket } from './socket/index.js';

// Models for public routes
import Table from './models/Table.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [/^http:\/\/localhost:\d+$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize socket handlers
initSocket(io);

app.use(cors({ origin: [/^http:\/\/localhost:\d+$/] }));
app.use(express.json());

// API routes
app.use('/auth', authRoutes);
app.use('/tables', tableRoutes);
app.use('/categories', categoryRoutes);
app.use('/menu', menuRoutes);
app.use('/sessions', sessionRoutes);
app.use('/orders', orderRoutes);
app.use('/bills', billRoutes);
app.use('/support', supportRoutes);
app.use('/dashboard', dashboardRoutes);

// Public: get available tables (for customer table switching)
app.get('/api/tables/public', async (req, res) => {
  try {
    const tables = await Table.find({}, 'number status').sort('number');
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong from backend' });
});

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port ' + port + ' already in use. Shutting down gracefully.');
    process.exit(0);
  }
  throw err;
});

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 }).then(() => {
  console.log('MongoDB connected');
  server.listen(port, () => {
    console.log('Backend running on http://localhost:' + port + ' with DB');
  });
}).catch((error) => {
  console.error('MongoDB connection error:', error.message);
  server.listen(port, () => {
    console.log('Backend running on http://localhost:' + port + ' without DB');
  });
});
