const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  googleId: { type: String, sparse: true, unique: true },
  password: { type: String },
  picture: { type: String },
  profileComplete: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  phoneVerified: { type: Boolean, default: false },
  isTest: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
