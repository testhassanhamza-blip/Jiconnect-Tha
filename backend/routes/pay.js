// backend/routes/pay.js
const express = require('express');
const router = express.Router();
const generatePDF = require('../pdf');
const { ajouterHotspotUser } = require('./mikrotik'); // OK: même dossier
const Sale = require('../models/Sale');

// POST /api/pay
router.post('/pay', async (req, res) => {
  const { fullName, phoneNumber, planName, amount, duration } = req.body;

  try {
    // Identifiants hotspot simulés
    const username = 'u' + Math.random().toString(36).substring(2, 6);
    const password = Math.random().toString(36).substring(2, 8);

    // Reçu (nom de fichier court)
    const safeName = (fullName || 'Client').replace(/\s+/g, '');
    const receiptId = `${new Date().toISOString().slice(0, 10)}_${safeName}`;
    const pdfPath = `/receipts/${receiptId}.pdf`;

    // ➕ MikroTik (mock en prod grâce à mikrotik.js)
    await ajouterHotspotUser({ username, password, duration });

    // 🧾 PDF
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

    // 💾 MongoDB
    await new Sale({
      fullName,
      phoneNumber,
      planName,
      amount,
      username,
      password,
      duration,
      receiptId,
      pdfPath, // ← important pour le lien "Ouvrir" côté frontend
      method: 'sandbox',
      transactionId: `TEST-${Date.now()}`, // simulé
      date: new Date(),
    }).save();

    // ✅ Réponse
    res.status(200).json({
      success: true,
      message: 'Paiement simulé réussi et utilisateur ajouté',
      username,
      password,
      receiptUrl: pdfPath,
    });
  } catch (error) {
    console.error('Erreur paiement :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement',
      error: String(error?.message || error),
    });
  }
});

module.exports = router;
