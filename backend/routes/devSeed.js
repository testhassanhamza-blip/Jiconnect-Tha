// backend/routes/devSeed.js
const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const router = express.Router();

/** Seed admin:
 *  - email: admin@jiconnect.co
 *  - pass : Admin123!
 *  Activation:
 *  - ENABLE_SEED=true (env)
 *  - Optionnel: DEV_SEED_TOKEN doit matcher ?token=... (GET) ou body.token (POST)
 */

// essaie User/Admin, sinon modèle minimal "users"
function getUserModel() {
  try { return require("../models/User"); } catch {}
  try { return require("../models/Admin"); } catch {}
  const { Schema, model } = mongoose;
  const schema = new Schema({
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "admin" },
    name: String,
  });
  return model("User", schema, "users");
}

async function handleSeed(req, res) {
  try {
    if (process.env.ENABLE_SEED !== "true") {
      return res.status(403).json({ ok: false, error: "seed_disabled" });
    }
    const expected = process.env.DEV_SEED_TOKEN || "";
    const provided = (req.method === "GET" ? req.query.token : req.body?.token) || "";
    if (expected && provided !== expected) {
      return res.status(401).json({ ok: false, error: "bad_token" });
    }

    const User = getUserModel();
    const email = "admin@jiconnect.co";
    const plain = "Admin123!";
    const hash = await bcrypt.hash(plain, 10);

    const existing = await User.findOne({ email });
    if (existing) {
      existing.password = hash;
      if (!existing.role) existing.role = "admin";
      if (!existing.name) existing.name = "Super Admin";
      await existing.save();
    } else {
      await User.create({ email, password: hash, role: "admin", name: "Super Admin" });
    }
    return res.json({ ok: true, email, password: plain });
  } catch (e) {
    console.error("seed-admin error:", e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

router.get("/seed-admin", handleSeed);
router.post("/seed-admin", express.json(), handleSeed);

module.exports = router;
