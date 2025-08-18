// backend/routes/mikrotik.js
const { RouterOSAPI } = require('node-routeros');

/**
 * MODE DE FONCTIONNEMENT
 * - Par défaut en PRODUCTION (Render), on fonctionne en MOCK pour éviter
 *   tout timeout vers un routeur non accessible depuis le cloud.
 * - Tu peux forcer le mode: MIKROTIK_MODE=mock | real
 * - En mode real, on applique aussi un timeout de connexion pour éviter les 500 longs.
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const MODE = (process.env.MIKROTIK_MODE || (NODE_ENV === 'production' ? 'mock' : 'real')).toLowerCase();
const CONNECT_TIMEOUT_MS = Number(process.env.MIKROTIK_CONNECT_TIMEOUT_MS || 5000);

// Jeu de données mock pour tests cloud
const MOCK_ACTIVE = [
  {
    id: 'm1',
    username: 'guest-001',
    ip: '192.168.88.10',
    mac: '4C:5E:0C:AA:BB:01',
    uptime: '00:12:33',
    bytesIn: '123456',
    bytesOut: '456789',
    loginBy: 'http-chap',
    left: '',
    comment: 'mock-user',
  },
  {
    id: 'm2',
    username: 'guest-002',
    ip: '192.168.88.11',
    mac: '4C:5E:0C:AA:BB:02',
    uptime: '01:04:12',
    bytesIn: '987654',
    bytesOut: '321000',
    loginBy: 'http-chap',
    left: '',
    comment: 'mock-user',
  },
];

function isMock() {
  if (MODE === 'mock') return true;
  if (MODE === 'real') return false;
  // Sécurité: en production on mock par défaut
  return NODE_ENV === 'production';
}

function haveRealCreds() {
  return !!(process.env.MIKROTIK_HOST && process.env.MIKROTIK_USER && process.env.MIKROTIK_PASS);
}

function getConn() {
  return new RouterOSAPI({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASS,
    port: Number(process.env.MIKROTIK_PORT || 8728),
    timeout: CONNECT_TIMEOUT_MS, // pris en charge par node-routeros >= 5
  });
}

// Petit helper de timeout si la lib ne coupe pas à temps (double sécurité)
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label || 'Operation'} timed out after ${ms} ms`)), ms)
    ),
  ]);
}

// ➕ Ajouter un utilisateur Hotspot
async function ajouterHotspotUser({ username, password, duration }) {
  if (isMock() || !haveRealCreds()) {
    console.log('ⓘ MikroTik désactivé (mock) — ajout simulé:', { username, duration });
    return { success: true, disabled: true };
  }

  const conn = getConn();
  try {
    await withTimeout(conn.connect(), CONNECT_TIMEOUT_MS, 'MikroTik connect');
    await withTimeout(
      conn.write('/ip/hotspot/user/add', [
        `=name=${username}`,
        `=password=${password}`,
        `=limit-uptime=${duration}`,
      ]),
      CONNECT_TIMEOUT_MS,
      'Add user'
    );
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
  if (isMock() || !haveRealCreds()) {
    // En mode cloud test, on répond "mock" pour être explicite
    return { online: false, mode: 'mock' };
  }

  const conn = getConn();
  try {
    await withTimeout(conn.connect(), CONNECT_TIMEOUT_MS, 'MikroTik connect');
    await conn.close();
    return { online: true, mode: 'real' };
  } catch (e) {
    try { await conn.close(); } catch (_) {}
    return { online: false, mode: 'real', error: e?.message || 'connect failed' };
  }
}

// 📋 Lister les sessions Hotspot actives
async function listerSessionsActives() {
  if (isMock() || !haveRealCreds()) {
    // Mock simple pour tests cloud (réponse immédiate)
    return MOCK_ACTIVE;
  }

  const conn = getConn();
  try {
    await withTimeout(conn.connect(), CONNECT_TIMEOUT_MS, 'MikroTik connect');
    const res = await withTimeout(
      conn.write('/ip/hotspot/active/print'),
      CONNECT_TIMEOUT_MS,
      'Active print'
    );
    await conn.close();
    return (res || []).map((row) => ({
      id: row['.id'] || '',
      username: row['user'] || '',
      ip: row['address'] || '',
      mac: row['mac-address'] || '',
      uptime: row['uptime'] || '',
      bytesIn: String(row['bytes-in'] || '0'),
      bytesOut: String(row['bytes-out'] || '0'),
      loginBy: row['login-by'] || '',
      left: row['session-time-left'] || '',
    }));
  } catch (error) {
    console.error('❌ Erreur listage hotspot active :', error.message);
    try { await conn.close(); } catch (_) {}
    // On NE jette PAS l’erreur en prod pour éviter un 500 côté API → renvoi mock
    if (NODE_ENV === 'production') return MOCK_ACTIVE;
    throw error;
  }
}

// ⛔️ Déconnecter une session (par .id MikroTik)
async function deconnecterSessionById(id) {
  if (isMock() || !haveRealCreds()) {
    console.log('ⓘ MikroTik désactivé (mock) — kick simulé:', id);
    return { success: true, disabled: true };
  }

  const conn = getConn();
  try {
    await withTimeout(conn.connect(), CONNECT_TIMEOUT_MS, 'MikroTik connect');
    await withTimeout(
      conn.write('/ip/hotspot/active/remove', [`=.id=${id}`]),
      CONNECT_TIMEOUT_MS,
      'Active remove'
    );
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
