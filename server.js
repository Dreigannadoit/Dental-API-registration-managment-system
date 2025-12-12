const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Simple CORS for development
app.use(cors({
  origin: 'http://localhost:5173' || process.env.CLIENT_URL,
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.log('MongoDB connection error:', err);
    process.exit(1);
  });

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test`);
});