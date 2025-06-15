// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobileHash: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  discountCode: {
    type: String,
    required: true
  },
  diceResult: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  shopifyPriceRuleId: {
    type: String,
    default: null
  },
  shopifyDiscountCodeId: {
    type: String,
    default: null
  },
  isShopifyCode: {
    type: Boolean,
    default: false
  },
  playedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
userSchema.index({ playedAt: -1 });
userSchema.index({ discountCode: 1 });

module.exports = mongoose.model('User', userSchema);