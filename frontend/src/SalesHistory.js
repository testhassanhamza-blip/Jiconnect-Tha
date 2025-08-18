// src/SalesHistory.js
import React, { useState, useEffect, useMemo } from 'react';
import api from './api';

/**
 * On déduit l'origine API (sans /api) pour construire les liens PDF.
 * - Si api.defaults.baseURL = https://.../api => API_ORIGIN = https://...
 * - Sinon, fallback sur le backend Render connu.
 */
const API_BASE = (api?.defaults?.baseURL) || 'https://jiconnect-backend.onrender.com/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const COLORS = {
  bg: '#0a174e',
  accent: '#f5d042',
  text: '#ffffff',
  soft: '#111827',
  border: '#26324f',
};

function formatTZS(n) {
  const num = Number(n || 0);
  return num.toLocaleString('fr-TZ', { maximumFractionDigits: 0 }) + ' TZS';
}

function fmtDate(d) {
  if (!d) return '—';
  const t = new Date(d);
  if (isNaN(t.getTime())) return '—';
  return t.toLocaleString('fr-FR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function SalesHistory() {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // filtres
  const [filtre, setFiltre] = useState('all'); // 'all' | 'today' | 'month'
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr('');

    api.get('/ventes')
      .then(res => {
        if (!alive) return;
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setVentes(data);
      })
      .catch(e => {
        console.error('Erreur chargement ventes', e);
        setErr(`Impossible de charger les ventes. (GET ${API_BASE}/ventes)`);
      })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, []);

  const todayISO = new Date().toISOString().slice(0, 10);

  const ventesFiltrees = useMemo(() => {
    let arr = Array.isArray(ventes) ? [...ventes] : [];

    // Filtre période
    arr = arr.filter(v => {
      const when = v.createdAt || v.date || v.timestamp;
      const iso = when ? new Date(when).toISOString().slice(0, 10) : '';
      if (filtre === 'today' && iso !== todayISO) return false;
      if (filtre === 'month' && (!iso || !iso.startsWith(todayISO.slice(0, 7)))) return false;
      return true;
    });

    // Recherche texte
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(v => {
        const parts = [
          v.fullName, v.nom, v.customerName,
          v.phoneNumber, v.phone, v.msisdn, v.numero,
          v.planName, v.forfait, v.plan,
          v.transactionId, v.txid, v.reference,
          v.method, v.paymentMethod, v.username,
        ].filter(Boolean).join(' ').toLowerCase();
        return parts.includes(q);
      });
    }

    // Tri (récent d'abord)
    arr.sort((a, b) =>
      new Date(b.createdAt || b.date || b.timestamp || 0) -
      new Date(a.createdAt || a.date || a.timestamp || 0)
    );

    return arr;
  }, [ventes, filtre, search, todayISO]);

  const totalVentes = ventesFiltrees.length;
  const totalMontant = useMemo(() => {
    return ventesFiltrees.reduce((sum, v) => {
      const n = Number(
        v.amount ?? v.montant ?? v.total ?? v.price ?? (v.meta && v.meta.amount) ?? 0
      );
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  }, [ventesFiltrees]);

  function getReceiptHref(v) {
    // Priorité aux URLs absolues si déjà fournies
    const absolute = v.receiptUrl || (v.meta && v.meta.receiptUrl);
    if (absolute && /^https?:\/\//i.test(absolute)) return absolute;

    // Chemin relatif renvoyé par l'API (ex: /receipts/xxx.pdf)
    const rel = v.pdfPath || v.receiptPath || v.receiptUrl;
    if (rel) {
      return `${API_ORIGIN}${rel.startsWith('/') ? '' : '/'}${rel}`;
    }

    // Ancien schéma via receiptId
    if (v.receiptId) {
      return `${API_ORIGIN}/receipts/${v.receiptId}.pdf`;
    }

    return null;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={{ margin: 0, color: COLORS.accent }}>Historia ya mauzo (Sales History)</h2>
        <div style={{ color: '#9ca3af', fontSize: 12 }}>
          API: <code>{API_BASE}/ventes</code>
        </div>
      </div>

      {/* Stats & Filtres */}
      <div style={styles.filters}>
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Jumla ya Mauzo</div>
            <div style={styles.statValue}>{totalVentes}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Mapato yote</div>
            <div style={styles.statValue}>{formatTZS(totalMontant)}</div>
          </div>
        </div>

        <div style={styles.ctrlRow}>
          <input
            type="text"
            placeholder="Tafuta: jina, namba, kifurushi, TxID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...styles.input, flex: 1, minWidth: 220 }}
          />
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)} style={styles.select}>
            <option value="all">Zote (Tous)</option>
            <option value="today">Leo (Aujourd’hui)</option>
            <option value="month">Mwezi huu (Ce mois)</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div style={styles.panel}>
        {loading ? (
          <div style={styles.loading}>Inapakia… / Chargement…</div>
        ) : err ? (
          <div style={styles.error}>{err}</div>
        ) : ventesFiltrees.length === 0 ? (
          <div style={styles.empty}>Hakuna mauzo kwa sasa / Aucune vente.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Tarehe (Date)</th>
                  <th>Mteja (Client)</th>
                  <th>Simu</th>
                  <th>Kifurushi (Plan)</th>
                  <th>Kiasi (Montant)</th>
                  <th>Mbinu (Méthode)</th>
                  <th>TxID</th>
                  <th>Reçu</th>
                </tr>
              </thead>
              <tbody>
                {ventesFiltrees.map((v, i) => {
                  const name = v.fullName || v.nom || v.customerName || '—';
                  const phone = v.phoneNumber || v.phone || v.msisdn || v.numero || '—';
                  const plan = v.planName || v.forfait || v.plan ||
                    (v.duration ? `${v.duration}${v.speed ? ' / ' + v.speed : ''}` : '—');
                  const amount = v.amount ?? v.montant ?? v.total ?? v.price ?? (v.meta && v.meta.amount);
                  const method = v.method || v.paymentMethod || '—';
                  const txid = v.transactionId || v.txid || v.reference || '—';
                  const when = v.createdAt || v.date || v.timestamp;
                  const receiptHref = getReceiptHref(v);

                  return (
                    <tr key={v._id || v.id || i}>
                      <td>{fmtDate(when)}</td>
                      <td>{name}</td>
                      <td>{phone}</td>
                      <td>{plan}</td>
                      <td>{formatTZS(amount)}</td>
                      <td>{method}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{txid}</td>
                      <td>
                        {receiptHref ? (
                          <a href={receiptHref} target="_blank" rel="noreferrer" style={styles.link}>
                            Ouvrir
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Styles (dark, propre, responsive) ===== */
const styles = {
  page: {
    minHeight: '100vh',
    background: COLORS.bg,
    color: COLORS.text,
    padding: 16,
    fontFamily: 'Segoe UI, Tahoma, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filters: {
    background: COLORS.soft,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  statsRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statCard: {
    flex: '0 0 180px',
    background: '#0f172a',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 12,
  },
  statLabel: { fontSize: 12, color: '#a1a1aa', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 700, color: COLORS.accent },
  ctrlRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  input: {
    background: '#0f172a',
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    padding: '10px 12px',
    borderRadius: 10,
  },
  select: {
    background: '#0f172a',
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    padding: '10px 12px',
    borderRadius: 10,
    minWidth: 160,
  },
  panel: {
    background: COLORS.soft,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  loading: {
    padding: 24,
    textAlign: 'center',
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: '#cbd5e1',
  },
  error: {
    padding: 14,
    color: '#ffb4b4',
    background: '#4b1d1d',
    borderRadius: 10,
    margin: 12,
  },
  link: {
    color: COLORS.accent,
    textDecoration: 'underline',
    fontWeight: 600,
  },
};
