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

module.exports = mongoose.model("CustomerTag", CustomerTagSchema);
