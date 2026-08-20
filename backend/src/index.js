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
import adminRoutes from './routes/admin.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { handleStripeWebhook } from './controllers/stripeController.js';
import dashboardRoutes from './routes/dashboard.js';

// Socket
import { initSocket } from './socket/index.js';


const app = express();
const server = http.createServer(app);

// ─── CORS ─────────────────────────────────────────
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [/^http:\/\/localhost:\d+$/];

// Auto-allow any Vercel URL for this project
const vercelPattern = /^https:\/\/smart-dine-.*\.vercel\.app$/;
function isOriginAllowed(origin) {
  if (!origin) return true;
  // Always allow localhost and 127.0.0.1 on any port in development/local testing
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (vercelPattern.test(origin)) return true;
  return false;
}
app.use(cors({
  origin: (origin, cb) => {
    if (isOriginAllowed(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (isOriginAllowed(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS: ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize socket handlers
initSocket(io);

// Stripe webhook needs raw body (before JSON parser)
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

if (process.env.SWAGGER_ENABLED !== 'false') {

  import('swagger-ui-express').then(async (swaggerUi) => {
    const swaggerSpec = (await import('./config/swagger.js')).default;
    app.use('/api-docs', swaggerUi.default.serve, swaggerUi.default.setup(swaggerSpec));
    console.log('[Swagger] /api-docs enabled (dev mode)');
  }).catch(() => {
    console.warn('[Swagger] swagger-ui-express not installed, skipping /api-docs');
  });
}

// API routes
app.use('/auth', authRoutes);
app.use('/tables', tableRoutes);
app.use('/categories', categoryRoutes);
app.use('/menu', menuRoutes);
app.use('/api/menu', menuRoutes);
app.use('/sessions', sessionRoutes);
app.use('/orders', orderRoutes);
app.use('/bills', billRoutes);
app.use('/support', supportRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/ping', (req, res) => {
  res.json({ message: 'pong from backend' });
});

// 404 + global error handler
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port ' + port + ' already in use. Shutting down gracefully.');
    process.exit(0);
  }
  throw err;
});

// Disable command buffering so queries fail fast instead of timing out
mongoose.set('bufferCommands', false);

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
}).then(() => {
  console.log('MongoDB connected');
  server.listen(port, () => {
    console.log('Backend running on http://localhost:' + port + ' with DB');
  });
}).catch((error) => {
  console.error('MongoDB connection error:', error.message);
  console.error('Server will NOT start — database is required.');
  process.exit(1);
});

