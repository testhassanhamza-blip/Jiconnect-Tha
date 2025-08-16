// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

// ⛔️ IMPORTANT : exporter UNE FONCTION, pas un objet
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload; // { id, email }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

module.exports = auth; // ✅ exporter la fonction directement
