// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// ---------- CORS CONFIG AMÉLIORÉE ----------
// Autorise localhost, ton domaine principal, et TOUTES les previews *.vercel.app
// Tu peux aussi ajouter des domaines via FRONTEND_ORIGINS (séparés par des virgules)
const DEFAULT_ALLOWED = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://jiconnect-tha.vercel.app",
  /\.vercel\.app$/ // <-- autorise n'importe quelle URL *.vercel.app
];

const envOrigins =
  (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

// Mélange : valeurs par défaut + celles de l'env (en chaînes exactes)
const ALLOWED_ORIGINS = [...DEFAULT_ALLOWED, ...envOrigins];

const corsOptions = {
  origin(origin, callback) {
    // Autoriser les requêtes server-to-server / Postman (origin = undefined)
    if (!origin) return callback(null, true);

    const ok = ALLOWED_ORIGINS.some(rule => {
      if (rule instanceof RegExp) return rule.test(origin);
      return rule === origin;
    });

    if (ok) return callback(null, true);
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false // garde false si tu n'utilises pas de cookies
};

app.use(cors(corsOptions));
// Important pour les requêtes préflight (OPTIONS)
app.options("*", cors(corsOptions));
// ---------- FIN CORS ----------

app.use(express.json());

// ⚠️ /public est éphémère sur beaucoup de PaaS gratuits (OK pour tests)
app.use(express.static(path.join(__dirname, "public")));

// ---------- MONGODB ----------
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jiconnect", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connexion MongoDB réussie"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// ---------- ROUTES ----------
app.use("/api", require("./routes/pay"));
app.use("/api", require("./routes/status"));
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/connected")); // Connected Users

// (Optionnel) Route de seed auto-montée si présente et activée
if (process.env.ENABLE_SEED === "true") {
  try {
    app.use("/api/dev", require("./routes/devSeed"));
    console.log("⚙️  Route /api/dev (seed) activée");
  } catch (e) {
    console.warn("ℹ️  routes/devSeed.js non trouvé, seed ignoré");
  }
}

// ---------- HEALTHCHECK ----------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ---------- DÉMARRAGE ----------
app.listen(PORT, () => {
  console.log(`🚀 Serveur Jiconnect actif sur http://localhost:${PORT}`);
});
