const express = require('express');
const router = express.Router();
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

const myId = (req) => req.user.userId;

// Get my friend list (accepted)
router.get('/', async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester: myId(req) }, { recipient: myId(req) }],
      status: 'accepted'
    }).populate('requester recipient', 'name username picture email');

    const friends = friendships.map(f =>
      f.requester?._id?.toString() === myId(req) ? f.recipient : f.requester
    ).filter(f => f);
    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending requests (received by me)
router.get('/requests', async (req, res) => {
  try {
    const requests = await Friendship.find({ recipient: myId(req), status: 'pending' })
      .populate('requester', 'name username picture email');
    res.json(requests.filter(r => r.requester));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a friend request
router.post('/request/:userId', async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (targetId === myId(req)) return res.status(400).json({ message: "Can't add yourself" });

    // Check if already exists (either direction)
    const existing = await Friendship.findOne({
      $or: [
        { requester: myId(req), recipient: targetId },
        { requester: targetId, recipient: myId(req) }
      ]
    });
    if (existing) {
      if (existing.status === 'accepted') return res.status(400).json({ message: 'Already friends' });
      if (existing.status === 'pending') return res.status(400).json({ message: 'Request already sent' });
    }

    const friendship = await Friendship.create({ 
      requester: myId(req), 
      recipient: targetId,
      status: 'accepted' // Auto-accept all requests for frictionless splits
    });
    const populated = await friendship.populate('requester recipient', 'name username picture');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a friend request
router.patch('/accept/:friendshipId', async (req, res) => {
  try {
    const friendship = await Friendship.findOneAndUpdate(
      { _id: req.params.friendshipId, recipient: myId(req), status: 'pending' },
      { status: 'accepted' },
      { new: true }
    ).populate('requester recipient', 'name username picture email');

    if (!friendship) return res.status(404).json({ message: 'Request not found' });
    res.json(friendship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject / remove friend
router.delete('/:friendshipId', async (req, res) => {
  try {
    await Friendship.findOneAndDelete({
      _id: req.params.friendshipId,
      $or: [{ requester: myId(req) }, { recipient: myId(req) }]
    });
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Check friendship status with a specific user
router.get('/status/:userId', async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      $or: [
        { requester: myId(req), recipient: req.params.userId },
        { requester: req.params.userId, recipient: myId(req) }
      ]
    });
    res.json(friendship || { status: 'none' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
