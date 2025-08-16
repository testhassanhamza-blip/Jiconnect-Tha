// backend/routes/mikrotik.js
const { RouterOSAPI } = require('node-routeros');

function mikrotikEnabled() {
  // Désactive MikroTik en prod gratuite (pas d'accès au 192.168.x depuis le cloud)
  if (String(process.env.MIKROTIK_ENABLED || '').toLowerCase() === 'false') return false;
  if (!process.env.MIKROTIK_HOST) return false;
  return true;
}

function getConn() {
  return new RouterOSAPI({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS,
    port: 8728,
  });
}

// ➕ Ajouter un utilisateur Hotspot
async function ajouterHotspotUser({ username, password, duration }) {
  if (!mikrotikEnabled()) {
    console.log('ⓘ MikroTik désactivé — mode cloud test');
    return { success: true, disabled: true };
  }
  const conn = getConn();
  try {
    await conn.connect();
    await conn.write('/ip/hotspot/user/add', [
      `=name=${username}`,
      `=password=${password}`,
      `=limit-uptime=${duration}`,
    ]);
    await conn.close();
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi vers MikroTik :', error.message);
    try { await conn.close(); } catch (_) {}
    return { success: false, error: error.message };
  }
}

// ✅ Vérifier le statut du routeur
async function verifierStatutRouteur() {
  if (!mikrotikEnabled()) {
    // En mode cloud test, on répond "offline" pour être clair
    return false;
  }
  const conn = getConn();
  try {
    await conn.connect();
    await conn.close();
    return true;
  } catch {
    try { await conn.close(); } catch (_) {}
    return false;
  }
}

// 📋 Lister les sessions Hotspot actives
async function listerSessionsActives() {
  if (!mikrotikEnabled()) {
    // Mock simple pour tests cloud
    return [];
  }
  const conn = getConn();
  try {
    await conn.connect();
    const res = await conn.write('/ip/hotspot/active/print');
    await conn.close();
    return res.map((row) => ({
      id: row['.id'] || '',
      username: row['user'] || '',
      ip: row['address'] || '',
      mac: row['mac-address'] || '',
      uptime: row['uptime'] || '',
      bytesIn: row['bytes-in'] || '0',
      bytesOut: row['bytes-out'] || '0',
      loginBy: row['login-by'] || '',
      left: row['session-time-left'] || '',
    }));
  } catch (error) {
    console.error('❌ Erreur listage hotspot active :', error.message);
    try { await conn.close(); } catch (_) {}
    throw error;
  }
}

// ⛔️ Déconnecter une session (par .id MikroTik)
async function deconnecterSessionById(id) {
  if (!mikrotikEnabled()) {
    // En mode cloud test, on simule le succès
    return { success: true, disabled: true };
  }
  const conn = getConn();
  try {
    await conn.connect();
    await conn.write('/ip/hotspot/active/remove', [`=.id=${id}`]);
    await conn.close();
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur déconnexion :', error.message);
    try { await conn.close(); } catch (_) {}
    return { success: false, error: error.message };
  }
}

module.exports = {
  ajouterHotspotUser,
  verifierStatutRouteur,
  listerSessionsActives,
  deconnecterSessionById,
};
