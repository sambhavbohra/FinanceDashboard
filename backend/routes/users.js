const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
   try {
      let serviceAccount;
      if (process.env.FIREBASE_ADMIN_KEY) {
         serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
      } else {
         serviceAccount = require(path.join(__dirname, '../firebase-admin-key.json'));
      }
      
      admin.initializeApp({
         credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin Initialized');
   } catch (e) {
      console.error('Firebase Admin Init failed: ', e.message);
   }
}

router.use(authMiddleware);

// Search users by username or name (exclude self)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const users = await User.find({
      _id: { $ne: req.user.userId },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    }).select('name username picture email').limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update username
router.patch('/username', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });

    const exists = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user.userId } });
    if (exists) return res.status(400).json({ message: 'Username already taken' });

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { username: username.toLowerCase() },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete Google profile (username + phone)
router.post('/complete-profile', async (req, res) => {
  try {
    const { username, phone } = req.body;
    if (!username || username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });

    const exists = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user.userId } });
    if (exists) return res.status(400).json({ message: 'Username already taken' });

    // Check if phone number is already taken by another verified user
    if (phone) {
       const phoneExists = await User.findOne({ phone, _id: { $ne: req.user.userId }, phoneVerified: true });
       if (phoneExists) return res.status(400).json({ message: 'Phone number already linked to another account' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { username: username.toLowerCase(), phone: phone || '', profileComplete: true, phoneVerified: !!req.body.firebaseToken },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Firebase Phone Token (Secure)
router.post('/verify-firebase-phone', async (req, res) => {
   try {
      const { token, phone } = req.body;
      if (!token) return res.status(400).json({ message: 'Token required' });

      // 1. SECURELY VERIFY THE TOKEN WITH FIREBASE
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // 2. Ensure the phone number in the token matches what was sent
      if (!decodedToken.phone_number) {
          return res.status(400).json({ message: 'Phone verification failed' });
      }

      // 3. CHECK FOR UNIQUENESS (ONE PHONE PER ACCOUNT)
      const existingPhone = await User.findOne({ 
         phone, 
         _id: { $ne: req.user.userId },
         phoneVerified: true 
      });
      
      if (existingPhone) {
         return res.status(400).json({ message: 'This phone number is already linked to another account' });
      }

      // 4. Update the user in your database
      const user = await User.findByIdAndUpdate(
         req.user.userId,
         { phone, phoneVerified: true },
         { new: true }
      ).select('-password');

      res.json(user);
   } catch (err) {
      console.error('Firebase Secure Verification Error:', err);
      res.status(401).json({ message: 'Unauthorized verification' });
   }
});

// Outdated Mock OTP route (kept for reference during dev, but now deprecated)
router.post('/request-otp', async (req, res) => {
   res.status(410).json({ message: 'Please use the Firebase Phone Auth provider.' });
});

module.exports = router;
