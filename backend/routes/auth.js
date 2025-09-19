// backend/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // ⚠️ utilise bcryptjs (plus léger et déjà installé)
const Admin = require("../models/Admin");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * 🚨 ATTENTION
 * La route /auth/seed a servi pour créer le premier admin.
 * On la désactive en production pour éviter tout accès non autorisé.
 * Si besoin, décommente temporairement pour recréer un admin.
 */
// router.post("/auth/seed", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ error: "email et password requis" });

//     const admin = await Admin.createAdmin(email, password);
//     res.json({ ok: true, email: admin.email });
//   } catch (e) {
//     res.status(500).json({ error: "seed error", details: e.message });
//   }
// });

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: "Identifiants invalides" });

    const ok = await admin.checkPassword(password);
    if (!ok) return res.status(401).json({ error: "Identifiants invalides" });

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { email: admin.email, role: "admin" }
    });
  } catch (e) {
    console.error("Erreur login:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/auth/me
router.get("/auth/me", auth, async (req, res) => {
  res.json({ email: req.user.email, id: req.user.id });
});

// POST /api/auth/change-password
router.post("/auth/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Champs requis" });

    const admin = await Admin.findOne({ email: req.user.email });
    if (!admin) return res.status(404).json({ error: "Admin introuvable" });

    const ok = await admin.checkPassword(currentPassword);
    if (!ok) return res.status(401).json({ error: "Mot de passe actuel incorrect" });

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ ok: true });
  } catch (e) {
    console.error("Erreur change-password:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
