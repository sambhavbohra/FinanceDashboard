const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// Get all notifications for user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('relatedGroup');
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
       { _id: req.params.id, user: req.user.userId },
       { read: true },
       { new: true }
    );
    res.json(notification);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Clear all
router.delete('/', auth, async (req, res) => {
   try {
      await Notification.deleteMany({ user: req.user.userId });
      res.json({ message: 'Notifications cleared' });
   } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
