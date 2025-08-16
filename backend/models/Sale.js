const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  fullName: String,
  phoneNumber: String,
  planName: String,
  amount: Number,
  username: String,
  password: String,
  duration: String,
  receiptId: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', saleSchema);