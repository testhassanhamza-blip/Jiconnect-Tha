// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

/* =========================
   CORS — mode simple (JWT)
   =========================
   - credentials:false car on n’utilise PAS de cookies de session.
   - On autorise ton domaine Vercel + toutes les previews *.vercel.app.
   - Plus tard, si tu veux des cookies cross-site, on passera à credentials:true
     et on adaptera aussi le frontend (axios.withCredentials = true).
*/
const DEFAULT_ALLOWED = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://jiconnect-tha.vercel.app",
  /\.vercel\.app$/ // autorise toutes les previews *.vercel.app
];

// Tu peux ajouter d'autres domaines via FRONTEND_ORIGINS (séparés par des virgules)
const envOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [...DEFAULT_ALLOWED, ...envOrigins];

const corsOptions = {
  origin(origin, callback) {
    // Autorise Postman / server-to-server (origin null/undefined)
    if (!origin) return callback(null, true);
    const ok = ALLOWED_ORIGINS.some(rule => {
      if (rule instanceof RegExp) return rule.test(origin);
      return rule === origin;
    });
    if (ok) return callback(null, true);
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Autorise les entêtes usuels + cache-control (vu dans tes requêtes)
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control", "cache-control",
    "Pragma", "pragma",
    "Expires", "expires",
    "X-Requested-With"
  ],
  // ✅ Pas de cookies cross-origin (on utilise les tokens JWT)
  credentials: false
};

app.use(cors(corsOptions));
// Préflight
app.options("*", cors(corsOptions));

/* =========================
   Middlewares & Static
   ========================= */
app.use(express.json());

// ⚠️ /public est éphémère sur Render (ok pour tests: reçus PDF, etc.)
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   MongoDB
   ========================= */
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jiconnect", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connexion MongoDB réussie"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

/* =========================
   Routes API
   ========================= */
app.use("/api", require("./routes/pay"));       // POST /api/pay (vente + PDF + (mock) MikroTik)
app.use("/api", require("./routes/ventes"));    // GET  /api/ventes (historique MongoDB)
app.use("/api", require("./routes/status"));    // GET  /api/status (état routeur)
app.use("/api", require("./routes/auth"));      // POST /api/auth/login
app.use("/api", require("./routes/connected")); // GET/POST hotspot (mock si désactivé)

/* =========================
   Seed (optionnel)
   =========================
   ENABLE_SEED=true pour activer.
   DEV_SEED_TOKEN (facultatif) à fournir via ?token=... ou body.token.
*/
if (process.env.ENABLE_SEED === "true") {
  try {
    app.use("/api/dev", require("./routes/devSeed"));
    console.log("⚙️  Route /api/dev (seed) activée");
  } catch (e) {
    console.warn("ℹ️  routes/devSeed.js non trouvé, seed ignoré");
  }
}

/* =========================
   Healthcheck
   ========================= */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

/* =========================
   Start
   ========================= */
app.listen(PORT, () => {
  console.log(`🚀 Serveur Jiconnect actif sur http://localhost:${PORT}`);
});
