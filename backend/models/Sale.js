// backend/models/Sale.js
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    fullName: String,
    phoneNumber: String,
    planName: String,
    amount: Number,

    // Infos Hotspot utiles (facultatif)
    username: String,
    password: String,
    duration: String,

    // Paiement (facultatif)
    transactionId: String,
    method: { type: String, default: 'sandbox' },

    // Reçu
    receiptId: String, // ex: 2025-08-18_Client
    pdfPath: String,   // ex: /receipts/2025-08-18_Client.pdf

    // Compat : ton ancien champ
    date: { type: Date, default: Date.now },
  },
  { timestamps: true } // createdAt / updatedAt auto
);

module.exports = mongoose.model('Sale', saleSchema);
