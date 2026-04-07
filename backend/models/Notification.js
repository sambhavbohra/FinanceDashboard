const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['request', 'update', 'alert'], default: 'update' },
  read: { type: Boolean, default: false },
  relatedGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  relatedExpense: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupExpense' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', NotificationSchema);
