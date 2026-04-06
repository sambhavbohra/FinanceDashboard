const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Sign-In
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ googleId });
    
    if (!user) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        existingUser.googleId = googleId;
        if (!existingUser.picture) existingUser.picture = picture;
        await existingUser.save();
        user = existingUser;
      } else {
        // New Google user — needs profile completion
        user = await User.create({ googleId, email, name, picture, profileComplete: false });
      }
    }

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'super_secret_jwt_key',
      { expiresIn: '7d' }
    );

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Custom Email Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Check username uniqueness
    if (username) {
      const usernameExists = await User.findOne({ username: username.toLowerCase() });
      if (usernameExists) return res.status(400).json({ message: 'Username already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      email,
      name,
      username: username ? username.toLowerCase() : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
      password: hashedPassword
    });

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'super_secret_jwt_key',
      { expiresIn: '7d' }
    );

    res.json({ token: jwtToken, user: { _id: user._id, email: user.email, name: user.name, username: user.username } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Custom Email Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'super_secret_jwt_key',
      { expiresIn: '7d' }
    );

    res.json({ token: jwtToken, user: { _id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', require('../middleware/authMiddleware'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
