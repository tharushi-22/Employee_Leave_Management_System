const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leaveRoutes = require('./routes/leaves');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// Routes
app.use('/auth', authRoutes);
app.use('/leaves', leaveRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});