// backend/routes/ventes.js
const express = require('express');
const Sale = require('../models/Sale');
const router = express.Router();

// GET /api/ventes
router.get('/ventes', async (req, res) => {
  try {
    // Tri récent d'abord (createdAt si dispo puis date)
    const ventes = await Sale.find().sort({ createdAt: -1, date: -1 }).lean();
    res.json(ventes);
  } catch (error) {
    console.error('Erreur récupération des ventes :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
