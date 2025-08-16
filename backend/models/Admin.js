// backend/models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
});

// Méthode statique pour créer un admin (une seule fois)
AdminSchema.statics.createAdmin = async function (email, password) {
  const Admin = this;
  const exists = await Admin.findOne({ email });
  if (exists) return exists;
  const passwordHash = await bcrypt.hash(password, 10);
  return Admin.create({ email, passwordHash });
};

// Méthode d'instance pour vérifier le mot de passe
AdminSchema.methods.checkPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Admin', AdminSchema);
