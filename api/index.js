require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const logger = require('../src/utils/logger');
const errorHandler = require('../src/middleware/errorHandler');
const rateLimiter = require('../src/middleware/rateLimiter');

const authRoutes = require('../src/routes/auth');
const analyzeRoutes = require('../src/routes/analyze');
const historyRoutes = require('../src/routes/history');
const weatherRoutes = require('../src/routes/weather');
const notificationRoutes = require('../src/routes/notifications');
const settingsRoutes = require('../src/routes/settings');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { 
    stream: { write: message => logger.info(message.trim()) }
  }));
} else {
  app.use(morgan('dev'));
}

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/auth', rateLimiter.authLimiter, authRoutes);
app.use('/analyze', rateLimiter.analyzeLimiter, analyzeRoutes);
app.use('/history', historyRoutes);
app.use('/weather', weatherRoutes);
app.use('/notifications', notificationRoutes);
app.use('/settings', settingsRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

app.use(errorHandler);

const connectDB = async () => {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb+srv://username:password@cluster.mongodb.net/farmphilo?retryWrites=true&w=majority') {
    logger.warn('MongoDB URI not configured. Running in demo mode without database.');
    return false;
  }
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    logger.warn('Running in demo mode without database.');
    return false;
  }
};

let dbConnected = false;

const startServer = async () => {
  dbConnected = await connectDB();
};

startServer();

module.exports = app;
