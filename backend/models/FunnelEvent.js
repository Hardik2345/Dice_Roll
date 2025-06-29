const mongoose = require("mongoose");

const funnelEventSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  name: { type: String }, // Add name field
  eventType: {
    type: String,
    required: true,
    enum: [
      "entered",
      "otp_sent",
      "otp_verified",
      "dice_rolled",
      "discount_used",
    ],
  },
  discountCode: { type: String }, // Added for discount tracking
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
});

funnelEventSchema.index({ mobile: 1, eventType: 1 });

module.exports = mongoose.model("FunnelEvent", funnelEventSchema);
