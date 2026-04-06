const mongoose = require('mongoose');

const SplitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false }
});

const PayerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }
});

const GroupExpenseSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  description: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  
  // SUPPORT FOR MULTIPLE PAYERS
  payers: [PayerSchema],
  
  // SUPPORT FOR MULTIPLE SPLITS
  splits: [SplitSchema],
  
  date: { type: Date, default: Date.now },
  category: { type: String, default: 'Other' }
});

module.exports = mongoose.model('GroupExpense', GroupExpenseSchema);
