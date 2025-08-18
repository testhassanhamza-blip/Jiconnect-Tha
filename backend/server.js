// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

/* ------------------------------------------------------------------
   CORS : autorise ton front Vercel + previews *.vercel.app
   - On n'utilise PAS de cookies -> credentials:false
   - On autorise les headers utilisés par le navigateur en preflight
------------------------------------------------------------------- */
const DEFAULT_ALLOWED = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://jiconnect-tha.vercel.app",
  /\.vercel\.app$/ // toutes les previews Vercel
];

// Origines additionnelles via env (séparées par virgules)
// ex: FRONTEND_ORIGINS="https://foo.com,https://bar.com"
const envOrigins =
  (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

const ALLOWED_ORIGINS = [...DEFAULT_ALLOWED, ...envOrigins];

const corsOptions = {
  origin(origin, callback) {
    // Autoriser Postman, server-to-server et healthchecks (origin = undefined)
    if (!origin) return callback(null, true);

    const ok = ALLOWED_ORIGINS.some(rule => {
      if (rule instanceof RegExp) return rule.test(origin);
      return rule === origin;
    });

    if (ok) return callback(null, true);
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Autorise les en-têtes classiques vus en preflight
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control", "cache-control",
    "Pragma", "pragma",
    "Expires", "expires",
    "X-Requested-With", "x-requested-with",
    "Accept", "accept"
  ],
  credentials: false // pas de cookies -> false
};

app.use(cors(corsOptions));
// indispensable pour les OPTIONS (preflight)
app.options("*", cors(corsOptions));

/* ------------------------------------------------------------------ */

app.use(express.json());

// ⚠️ /public est éphémère sur beaucoup de PaaS (OK pour tests)
app.use(express.static(path.join(__dirname, "public")));

// ----------------------- MONGODB -----------------------
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jiconnect", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connexion MongoDB réussie"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// ------------------------ ROUTES -----------------------
app.use("/api", require("./routes/pay"));        // /api/pay
app.use("/api", require("./routes/ventes"));     // /api/ventes
app.use("/api", require("./routes/status"));     // /api/status
app.use("/api", require("./routes/auth"));       // /api/auth/*
app.use("/api", require("./routes/connected"));  // /api/hotspot/active etc.

// (Optionnel) Route de seed auto-montée si présente et activée (fichier)
if (process.env.ENABLE_SEED === "true") {
  try {
    app.use("/api/dev", require("./routes/devSeed"));
    console.log("⚙️  Route /api/dev (seed) activée");
  } catch (e) {
    console.warn("ℹ️  routes/devSeed.js non trouvé, seed ignoré");
  }
}

/* === INLINE SEED ROUTE (fallback si routes/devSeed.js absent) ===
   - email: admin@jiconnect.co
   - pass : Admin123!
   Activation:
   - ENABLE_SEED=true
   - Optionnel: DEV_SEED_TOKEN doit matcher ?token=... (GET) ou body.token (POST)
*/
if (process.env.ENABLE_SEED === "true") {
  // bcrypt natif -> sinon fallback sur bcryptjs
  let bcryptLib;
  try { bcryptLib = require("bcrypt"); } catch { try { bcryptLib = require("bcryptjs"); } catch {} }

  const mongooseLocal = require("mongoose");

  // Essaie d'utiliser le modèle User/Admin existant, sinon modèle minimal
  let UserModel;
  try { UserModel = require("./models/User"); } catch {}
  if (!UserModel) { try { UserModel = require("./models/Admin"); } catch {} }
  if (!UserModel) {
    const { Schema, model } = mongooseLocal;
    const schema = new Schema({
      email: { type: String, unique: true },
      password: String,
      role: { type: String, default: "admin" },
      name: String,
    });
    UserModel = mongooseLocal.models.User || model("User", schema, "users");
  }

  async function seedHandler(req, res) {
    try {
      const expected = process.env.DEV_SEED_TOKEN || "";
      const provided =
        req.method === "GET" ? (req.query.token || "") : (req.body?.token || "");
      if (expected && provided !== expected) {
        return res.status(401).json({ ok: false, error: "bad_token" });
      }

      if (!bcryptLib) {
        console.error("❌ Ni 'bcrypt' ni 'bcryptjs' trouvés.");
        return res.status(500).json({ ok: false, error: "bcrypt_missing" });
      }

      const email = "admin@jiconnect.co";
      const plain = "Admin123!";
      const hash = await bcryptLib.hash(plain, 10);

      const existing = await UserModel.findOne({ email });
      if (existing) {
        existing.password = hash;
        if (!existing.role) existing.role = "admin";
        if (!existing.name) existing.name = "Super Admin";
        await existing.save();
      } else {
        await UserModel.create({ email, password: hash, role: "admin", name: "Super Admin" });
      }
      return res.json({ ok: true, email, password: plain });
    } catch (e) {
      console.error("seed-admin error:", e);
      return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  }

  app.get("/api/dev/seed-admin", seedHandler);
  app.post("/api/dev/seed-admin", express.json(), seedHandler);
  console.log("⚙️  Inline /api/dev/seed-admin activé");
}
// === FIN INLINE SEED ROUTE ===

// ---------------------- HEALTHCHECK --------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ----------------------- START -------------------------
app.listen(PORT, () => {
  console.log(`🚀 Serveur Jiconnect actif sur http://localhost:${PORT}`);
});
