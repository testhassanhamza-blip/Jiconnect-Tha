import React, { useEffect, useMemo, useState } from 'react';
import api from './api';

function formatBytes(n) {
  const num = parseInt(n || 0, 10);
  if (isNaN(num)) return n || '0';
  if (num < 1024) return `${num} B`;
  const kb = num / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function ConnectedUsers() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/hotspot/active');
      setItems(res.data.items || []);
    } catch (e) {
      console.error('GET /hotspot/active error:', e?.response || e);
      const msg = e?.response?.data?.error || 'Erreur lors du chargement des sessions.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // auto-refresh toutes les 20s (optionnel)
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      (it.username || '').toLowerCase().includes(q) ||
      (it.ip || '').toLowerCase().includes(q) ||
      (it.mac || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleDisconnect = async (id) => {
    if (!window.confirm('Déconnecter cet utilisateur ?')) return;
    try {
      await api.post('/hotspot/disconnect', { id });
      // recharger après action
      await load();
    } catch (e) {
      console.error('POST /hotspot/disconnect error:', e?.response || e);
      alert('Echec de déconnexion');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerWrap}>
        <h1 style={styles.title}>Watumiaji Hai (Connected Users)</h1>
        <p style={styles.subtitle}>Orodha ya watumiaji waliopo kwenye hotspot sasa hivi</p>
      </div>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Tafuta: username / IP / MAC"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />
        <button onClick={load} style={styles.refreshBtn} disabled={loading}>
          {loading ? 'Inapakia…' : 'Actualiser'}
        </button>
      </div>

      {err && (
        <div style={{ ...styles.alert, backgroundColor: '#402121', color: '#ffb8b8', borderColor: '#8a3a3a' }}>
          {err}
        </div>
      )}

      {/* Table desktop */}
      <div style={styles.tableWrap}>
        <div style={styles.tableHeader}>
          <div style={{ ...styles.th, flex: 1.2 }}>Username</div>
          <div style={{ ...styles.th, flex: 1 }}>IP</div>
          <div style={{ ...styles.th, flex: 1 }}>MAC</div>
          <div style={{ ...styles.th, width: 100, textAlign: 'right' }}>In</div>
          <div style={{ ...styles.th, width: 100, textAlign: 'right' }}>Out</div>
          <div style={{ ...styles.th, width: 100 }}>Uptime</div>
          <div style={{ ...styles.th, width: 120 }}>Action</div>
        </div>

        {filtered.map((it) => (
          <div key={it.id} style={styles.tr}>
            <div style={{ ...styles.td, flex: 1.2, fontWeight: 600, color: '#f5d042' }}>{it.username || '-'}</div>
            <div style={{ ...styles.td, flex: 1 }}>{it.ip || '-'}</div>
            <div style={{ ...styles.td, flex: 1 }}>{it.mac || '-'}</div>
            <div style={{ ...styles.td, width: 100, textAlign: 'right' }}>{formatBytes(it.bytesIn)}</div>
            <div style={{ ...styles.td, width: 100, textAlign: 'right' }}>{formatBytes(it.bytesOut)}</div>
            <div style={{ ...styles.td, width: 100 }}>{it.uptime || '-'}</div>
            <div style={{ ...styles.td, width: 120 }}>
              <button style={styles.dangerBtn} onClick={() => handleDisconnect(it.id)}>
                Déconnecter
              </button>
            </div>
          </div>
        ))}

        {(!loading && filtered.length === 0) && (
          <div style={{ padding: 16, textAlign: 'center', color: '#aaa' }}>Hakuna watumiaji kwa sasa.</div>
        )}
      </div>

      {/* Cartes mobile */}
      <div style={styles.cards}>
        {filtered.map((it) => (
          <div key={`card-${it.id}`} style={styles.card}>
            <div style={styles.row}><strong>Username:</strong> {it.username || '-'}</div>
            <div style={styles.row}><strong>IP:</strong> {it.ip || '-'}</div>
            <div style={styles.row}><strong>MAC:</strong> {it.mac || '-'}</div>
            <div style={styles.row}><strong>In:</strong> {formatBytes(it.bytesIn)} &nbsp; <strong>Out:</strong> {formatBytes(it.bytesOut)}</div>
            <div style={styles.row}><strong>Uptime:</strong> {it.uptime || '-'}</div>
            <button style={styles.dangerBtnFull} onClick={() => handleDisconnect(it.id)}>
              Déconnecter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#0b0f1a', color: '#fff', padding: 20, fontFamily: 'Segoe UI, sans-serif', boxSizing: 'border-box' },
  headerWrap: { maxWidth: 1100, margin: '0 auto 14px', padding: '0 4px' },
  title: { margin: 0, color: '#f5d042', fontSize: 22 },
  subtitle: { marginTop: 6, color: '#bcbcbc', fontSize: 14 },

  toolbar: { maxWidth: 1100, margin: '0 auto 16px', display: 'flex', gap: 10, flexWrap: 'wrap' },
  input: { backgroundColor: '#0f172a', color: '#fff', border: '1px solid #2a364a', borderRadius: 8, padding: '10px 12px', outline: 'none', fontSize: 14, flex: '1 1 260px' },
  refreshBtn: { backgroundColor: '#f5d042', color: '#0a174e', border: 'none', borderRadius: 8, padding: '10px 14px', fontWeight: 'bold', cursor: 'pointer', fontSize: 14 },

  alert: { maxWidth: 1100, margin: '0 auto 12px', border: '1px solid', borderRadius: 8, padding: '10px 12px', fontSize: 13 },

  tableWrap: { display: 'none', maxWidth: 1100, margin: '0 auto', backgroundColor: '#111827', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.35)' },
  tableHeader: { display: 'flex', padding: '12px 14px', borderBottom: '1px solid #222a3a', backgroundColor: '#0f172a' },
  th: { color: '#ddd', fontSize: 13 },
  tr: { display: 'flex', padding: '10px 14px', borderBottom: '1px solid #1b2433', alignItems: 'center' },
  td: { fontSize: 14, color: '#fff' },

  cards: { display: 'grid', gap: 12 },

  card: { backgroundColor: '#111827', borderRadius: 10, padding: 12, boxShadow: '0 6px 16px rgba(0,0,0,0.35)' },
  row: { marginBottom: 6, fontSize: 14 },

  dangerBtn: { backgroundColor: '#2b1d1d', color: '#ffb4b4', border: '1px solid #693939', borderRadius: 8, padding: '8px 12px', fontWeight: 'bold', cursor: 'pointer', fontSize: 13 },
  dangerBtnFull: { width: '100%', backgroundColor: '#2b1d1d', color: '#ffb4b4', border: '1px solid #693939', borderRadius: 8, padding: '10px 14px', fontWeight: 'bold', cursor: 'pointer', fontSize: 14 },
};

// Breakpoint CSS via JS : table visible en >= 900px, cartes en < 900px
if (typeof window !== 'undefined') {
  const wide = window.innerWidth >= 900;
  styles.tableWrap.display = wide ? 'block' : 'none';
  styles.cards.gridTemplateColumns = wide ? 'repeat(3, minmax(220px, 1fr))' : '1fr';
}

export default ConnectedUsers;
