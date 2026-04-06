const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['warning', 'suggestion', 'success', 'trend'], required: true },
  priority: { type: Number, default: 0 },
  actionTaken: { type: Boolean, default: false },
  actionKey: { type: String }, // e.g., 'SET_BUDGET_FOOD', 'REMIND_FRIEND_RAHUL'
  metadata: { type: Object }, // Store specific transaction logic
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Insight', InsightSchema);
