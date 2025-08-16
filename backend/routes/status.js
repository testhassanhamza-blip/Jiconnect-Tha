// backend/routes/status.js

const express = require('express');
const router = express.Router();
const { verifierStatutRouteur } = require('./mikrotik');

router.get('/router/status', async (req, res) => {
  try {
    const online = await verifierStatutRouteur();
    res.json({ online });
  } catch (error) {
    res.status(500).json({ online: false, error: 'Erreur serveur' });
  }
});

module.exports = router; // ✅ c’est ça qui manquait
