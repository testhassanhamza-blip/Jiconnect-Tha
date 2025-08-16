// backend/routes/connected.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // protège les endpoints admin
const {
  listerSessionsActives,
  deconnecterSessionById,
} = require('./mikrotik');

// GET /api/hotspot/active — liste des sessions actives
router.get('/hotspot/active', auth, async (req, res) => {
  try {
    const sessions = await listerSessionsActives();
    res.json({ items: sessions, count: sessions.length });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur', details: e.message });
  }
});

// POST /api/hotspot/disconnect — déconnecter une session
// body: { id: ".id" }
router.post('/hotspot/disconnect', auth, async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "Paramètre 'id' requis" });
    const out = await deconnecterSessionById(id);
    if (!out.success) return res.status(500).json({ error: out.error || 'Echec déconnexion' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur', details: e.message });
  }
});

module.exports = router;
