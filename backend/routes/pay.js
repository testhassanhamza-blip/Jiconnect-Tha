// backend/routes/pay.js
const express = require('express');
const router = express.Router();
const generatePDF = require('../pdf');
const { ajouterHotspotUser } = require('./mikrotik'); // ✅ bon chemin car dans le même dossier
const Sale = require('../models/Sale');

// POST /api/pay
router.post('/', async (req, res) => {
  const { fullName, phoneNumber, planName, amount, duration } = req.body;

  try {
    const username = 'u' + Math.random().toString(36).substring(2, 6);
    const password = Math.random().toString(36).substring(2, 8);
    const safeName = (fullName || 'Client').replace(/\s+/g, '');
    const receiptId = `${new Date().toISOString().slice(0, 10)}_${safeName}`;

    // MikroTik
    await ajouterHotspotUser({ username, password, duration });

    // PDF
    await generatePDF({
      fullName,
      phoneNumber,
      planName,
      amount,
      username,
      password,
      duration,
      receiptId,
    });

    // MongoDB
    await new Sale({
      fullName,
      phoneNumber,
      planName,
      amount,
      username,
      password,
      duration,
      receiptId,
    }).save();

    res.status(200).json({
      success: true,
      message: 'Paiement simulé réussi et utilisateur ajouté',
      username,
      password,
      receiptUrl: `/receipts/${receiptId}.pdf`,
    });
  } catch (error) {
    console.error('Erreur paiement :', error);
    res.status(500).json({ success: false, message: 'Erreur lors du traitement', error: String(error?.message || error) });
  }
});

// GET /api/ventes
router.get('/ventes', async (req, res) => {
  try {
    const ventes = await Sale.find().sort({ date: -1 });
    res.status(200).json(ventes);
  } catch (error) {
    console.error('Erreur récupération des ventes :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; // ✅ IMPORTANT
