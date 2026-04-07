require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const groupRoutes = require('./routes/groups');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/requests', require('./routes/requests'));

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB Connected');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => console.error(err));
