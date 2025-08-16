// routes/devSeed.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// POST /api/dev/seed-admin
// Active seulement si process.env.ENABLE_SEED === 'true'
router.post('/seed-admin', async (req, res) => {
  try {
    if (process.env.ENABLE_SEED !== 'true') {
      return res.status(403).json({ error: 'Seed disabled' });
    }

    // adapte le chemin si besoin selon ton projet
    const User = require('../models/User');

    const email = 'admin@jiconnect.co';
    const password = 'Admin123!';

    const exists = await User.findOne({ email });
    if (exists) {
      return res.json({ ok: true, message: 'Admin already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name: 'Super Admin',
      email,
      password: hashed,
      role: 'admin'
    });

    return res.json({
      ok: true,
      admin: { id: admin._id.toString(), email: admin.email }
    });
  } catch (e) {
    console.error('Seed error:', e);
    return res.status(500).json({ error: 'Seed failed' });
  }
});

module.exports = router;
