const mongoose = require('mongoose');

const SplitRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupExpense' },
  type: { type: String, enum: ['edit', 'delete'], required: true },
  pendingData: { type: Object }, // Store the new expense data for 'edit'
  approvals: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }],
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SplitRequest', SplitRequestSchema);
