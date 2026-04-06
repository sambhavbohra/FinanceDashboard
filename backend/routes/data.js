const express = require('express');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// --- Transactions ---
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/transactions', async (req, res) => {
  try {
    const { type, amount, category, date, name } = req.body;
    const newTx = await Transaction.create({
      user: req.user.userId,
      type, amount, category, date, name
    });
    res.json(newTx);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/transactions/:id', async (req, res) => {
  try {
    await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/transactions/:id', async (req, res) => {
  try {
    const { name, amount, category, date, type } = req.body;
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { ...(name && { name }), ...(amount && { amount }), ...(category && { category }), ...(date && { date }), ...(type && { type }) },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Transaction not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Goals ---
router.get('/goals', async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.userId });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/goals', async (req, res) => {
  try {
    const { name, target, deadline } = req.body;
    const newGoal = await Goal.create({
      user: req.user.userId,
      name, target, deadline
    });
    res.json(newGoal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/goals/:id/add-funds', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.userId });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.current += Number(amount);
    await goal.save();

    // Create an expense transaction for the added funds
    const newTx = await Transaction.create({
      user: req.user.userId,
      type: 'expense',
      amount: Number(amount),
      category: 'Goal Contribution',
      date: new Date(),
      name: `Funded Goal: ${goal.name}`
    });

    res.json({ goal, transaction: newTx });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/goals/:id', async (req, res) => {
  try {
    const { name, target, deadline } = req.body;
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { ...(name && { name }), ...(target && { target }), ...(deadline && { deadline }) },
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/goals/:id', async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
