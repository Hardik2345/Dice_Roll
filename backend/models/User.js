// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  mobileHash: {
    type: String,
    required: true,
    unique: true,
  },
  mobileIdentifier:{
    type:String,
  },
  name: {
    type: String,
    required: true,
  },
  discountCode: {
    type: String,
    required: true,
  },
  marketPlace:{
    type:Boolean,
    required: true,
    default: false,
  },
  diceResult: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
  shopifyPriceRuleId: {
    type: String,
    default: null,
  },
  shopifyDiscountCodeId: {
    type: String,
    default: null,
  },
  isShopifyCode: {
    type: Boolean,
    default: false,
  },
  playedAt: {
    type: Date,
    default: Date.now,
  },
  generateOTPAt: {
    type: Date,
  },
  enteredOTPAt: {
    type: Date,
  },
  rollDiceAt: {
    type: Date,
  },
  discountUsedAt: {
    type: Date,
  },
  alreadyRedeemed: {
    type: Boolean,
    default: false,
  },
  lastCreditAt: { type: Date }
});

// Index for faster queries
userSchema.index({ playedAt: -1 });
userSchema.index({ discountCode: 1 });

module.exports = mongoose.model("User", userSchema);
