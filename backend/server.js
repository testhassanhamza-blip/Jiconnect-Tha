// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// ---------- CORS CONFIG AMÉLIORÉE ----------
const DEFAULT_ALLOWED = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://jiconnect-tha.vercel.app",
  /\.vercel\.app$/ // autorise *.vercel.app
];

const envOrigins =
  (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

const ALLOWED_ORIGINS = [...DEFAULT_ALLOWED, ...envOrigins];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // Postman / server-to-server
    const ok = ALLOWED_ORIGINS.some(rule => {
      if (rule instanceof RegExp) return rule.test(origin);
      return rule === origin;
    });
    if (ok) return callback(null, true);
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// ---------- FIN CORS ----------

app.use(express.json());

// ⚠️ /public est éphémère sur beaucoup de PaaS (OK pour tests)
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
app.use("/api", require("./routes/pay"));       // /api/pay
app.use("/api", require("./routes/ventes"));    // /api/ventes   ← AJOUT
app.use("/api", require("./routes/status"));    // (existant)
app.use("/api", require("./routes/auth"));      // (existant)
app.use("/api", require("./routes/connected")); // (existant)

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
