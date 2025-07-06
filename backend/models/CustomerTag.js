const mongoose = require("mongoose");

const CustomerTagSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  phoneNumber: {
    type: String,
    default: null,
  },
});

CustomerTagSchema.index({ customerId: 1 });

module.exports = mongoose.model("CustomerTag", CustomerTagSchema);
