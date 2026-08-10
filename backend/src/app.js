const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const compression = require('compression');

// Middleware
app.use(helmet());
app.use(compression());
const defaultOrigins = [
  'https://vihaansap-git-main-vihaan19.vercel.app',
  'https://vihaansap-gray.vercel.app',
  'https://www.srivihaanconsulting.com',
  'https://srivihaanconsulting.com'
];

const envOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) 
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Core DB API for MockDB replacement
app.use('/api/db', require('./routes/db.routes'));

// User Management API
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/public', require('./routes/public.routes'));

// Auth routes removed - Firebase authentication is used.

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Centralized error handling
const { errorHandler } = require('./middleware/error.middleware');
app.use(errorHandler);

module.exports = app;
