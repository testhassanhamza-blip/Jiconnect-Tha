// backend/routes/status.js
const express = require('express');
const router = express.Router();
const { verifierStatutRouteur } = require('./mikrotik');

//  GET /api/status
//  Renvoie l'état du routeur (ou false si désactivé/erreur)
router.get('/status', async (req, res) => {
  try {
    const online = await verifierStatutRouteur(); // boolean
    return res.json({ ok: true, online });
  } catch (e) {
    console.error('status error:', e?.message || e);
    // On ne renvoie pas d'erreur fatale pour ne pas casser le dashboard
    return res.json({ ok: true, online: false });
  }
});

module.exports = router;
