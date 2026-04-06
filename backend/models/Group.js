const mongoose = require('mongoose');
const crypto = require('crypto');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emoji: { type: String, default: '👥' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  inviteToken: { 
    type: String, 
    default: () => crypto.randomBytes(12).toString('hex'),
    unique: true
  },
  createdAt: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false }
});

module.exports = mongoose.model('Group', GroupSchema);
