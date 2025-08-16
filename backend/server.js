// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

// Middlewares
app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN,
  })
);
app.use(express.json());

// ⚠️ Les fichiers générés dans /public seront éphémères sur la plupart des PaaS gratuits.
// OK pour tests, mais à migrer vers un stockage (S3/Cloudinary/GridFS) en prod.
app.use(express.static(path.join(__dirname, "public")));

// MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jiconnect", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connexion MongoDB réussie"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// Routes
app.use("/api", require("./routes/pay"));
app.use("/api", require("./routes/status"));
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/connected")); // Connected Users

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur Jiconnect actif sur http://localhost:${PORT}`);
});
