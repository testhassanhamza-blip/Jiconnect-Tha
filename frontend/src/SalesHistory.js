import React, { useState, useEffect, useMemo } from 'react';
import api from './api';

function SalesHistory() {
  const [ventes, setVentes] = useState([]);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('all'); // all | today | month | range
  const [fromDate, setFromDate] = useState(''); // YYYY-MM-DD
  const [toDate, setToDate] = useState('');     // YYYY-MM-DD
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7); // YYYY-MM

  const refetch = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/ventes', { headers: { 'Cache-Control': 'no-cache' } });
      setVentes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Erreur chargement ventes', e);
      setErr("Imeshindikana kupakua mauzo. Jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  // Filtrage
  const ventesFiltrees = useMemo(() => {
    return ventes.filter((vente) => {
      const nomClient = vente.fullName || vente.nom || '';
      const numeroClient = vente.phoneNumber || vente.numero || '';
      const matchTexte =
        nomClient.toLowerCase().includes(search.toLowerCase()) ||
        numeroClient.includes(search);

      const d = new Date(vente.date);
      if (Number.isNaN(d.getTime())) return false;
      const iso = d.toISOString().slice(0, 10);

      if (filtre === 'today' && iso !== today) return false;
      if (filtre === 'month' && !iso.startsWith(thisMonth)) return false;
      if (filtre === 'range') {
        if (fromDate && iso < fromDate) return false;
        if (toDate && iso > toDate) return false;
      }

      return matchTexte;
    });
  }, [ventes, search, filtre, fromDate, toDate, today, thisMonth]);

  const totalVentes = ventesFiltrees.length;
  const totalMontant = ventesFiltrees.reduce(
    (sum, v) => sum + Number(v.amount || v.montant || 0),
    0
  );

  // Export CSV (filtré)
  const exportCSV = () => {
    const headers = [
      'Date',
      'Nom',
      'Téléphone',
      'Forfait',
      'Montant_TZS',
      'Username',
      'Password',
      'Durée',
      'ReceiptId',
    ];

    const rows = ventesFiltrees.map(v => ([
      new Date(v.date).toISOString(),
      (v.fullName || v.nom || '').replace(/[\r\n]+/g, ' '),
      v.phoneNumber || v.numero || '',
      v.planName || v.forfait || '',
      Number(v.amount || v.montant || 0),
      v.username || '',
      v.password || '',
      v.duration || '',
      v.receiptId || '',
    ]));

    const all = [headers, ...rows]
      .map(r => r.map(x => {
        const s = String(x ?? '');
        // Encadre de guillemets si besoin
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(','))
      .join('\n');

    const blob = new Blob([all], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fLabel =
      filtre === 'today' ? `_${today}` :
      filtre === 'month' ? `_${thisMonth}` :
      (filtre === 'range' ? `_${fromDate || 'start'}_${toDate || 'end'}` : '');
    a.href = url;
    a.download = `ventes${fLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Historia ya mauzo (Sales History)</h1>

      {/* Barre d’actions */}
      <div style={styles.actions}>
        <button onClick={refetch} style={styles.refreshBtn}>🔄 Actualiser</button>
        <button onClick={exportCSV} style={styles.exportBtn} disabled={ventesFiltrees.length === 0}>
          ⬇️ Exporter CSV ({ventesFiltrees.length})
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Jumla ya Mauzo</h3>
          <p style={styles.statValue}>{loading ? '…' : totalVentes}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Mapato yote (TZS)</h3>
          <p style={styles.statValue}>{loading ? '…' : totalMontant}</p>
        </div>
      </div>

      {/* Recherche + filtres */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Tafuta jina au namba..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />

        <select value={filtre} onChange={(e) => setFiltre(e.target.value)} style={styles.select}>
          <option value="all">Zote</option>
          <option value="today">Leo</option>
          <option value="month">Mwezi huu</option>
          <option value="range">Période</option>
        </select>

        {filtre === 'range' && (
          <div style={styles.rangeWrap}>
            <label style={styles.label}>Du</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={styles.date} />
            <label style={styles.label}>au</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={styles.date} />
          </div>
        )}
      </div>

      {/* Erreur éventuelle */}
      {err && <div style={styles.error}>{err}</div>}

      {/* Cartes */}
      <div style={styles.grid}>
        {loading ? (
          <p style={styles.empty}>Inapakia…</p>
        ) : (ventesFiltrees.length === 0 ? (
          <p style={styles.empty}>Hakuna mauzo yaliyopatikana.</p>
        ) : (
          ventesFiltrees.map((vente, index) => (
            <div key={index} style={styles.card}>
              <h3 style={styles.name}>{vente.fullName || vente.nom}</h3>
              <p><strong>Simu:</strong> {vente.phoneNumber || vente.numero}</p>
              <p><strong>Kifurushi:</strong> {vente.planName || vente.forfait} – {vente.amount || vente.montant} TZS</p>
              <p><strong>Tarehe:</strong> {new Date(vente.date).toLocaleString()}</p>
              {vente.receiptId && (
                <a
                  href={`/receipts/${vente.receiptId}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  Pakua Receipt
                </a>
              )}
            </div>
          ))
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '30px', backgroundColor: '#0b0f1a', minHeight: '100vh', color: '#ffffff', fontFamily: 'Segoe UI, sans-serif' },
  title: { fontSize: '24px', color: '#f5d042', textAlign: 'center', marginBottom: '16px' },

  actions: { display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 },
  refreshBtn: {
    background: '#111827', color: '#e5e7eb', border: '1px solid #374151',
    borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 600
  },
  exportBtn: {
    background: '#f5d042', color: '#0a174e', border: '1px solid #f5d042',
    borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 700
  },

  statsContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '16px', flexWrap: 'wrap' },
  statCard: { backgroundColor: '#111827', padding: '20px', borderRadius: '10px', width: '200px', textAlign: 'center', boxShadow: '0 3px 6px rgba(0,0,0,0.2)' },
  statTitle: { fontSize: '14px', color: '#ffffff', marginBottom: '6px' },
  statValue: { fontSize: '22px', color: '#f5d042', fontWeight: 'bold' },

  controls: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', justifyContent: 'center' },
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #444', width: '260px', backgroundColor: '#111827', color: '#fff' },
  select: { padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#111827', color: '#fff' },

  rangeWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  label: { color: '#cbd5e1', fontSize: 12 },
  date: { padding: '8px', borderRadius: 6, border: '1px solid #444', background: '#111827', color: '#fff' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' },
  card: { backgroundColor: '#111827', padding: '14px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', fontSize: '14px', lineHeight: '1.4em' },
  name: { color: '#f5d042', marginBottom: '6px', fontSize: '16px' },
  link: { marginTop: '8px', display: 'inline-block', color: '#f5d042', fontWeight: 'bold', textDecoration: 'underline', fontSize: '13px' },
  empty: { textAlign: 'center', color: '#ccc', gridColumn: '1 / -1', marginTop: '20px' },
  error: { backgroundColor: '#4b1d1d', color: '#ffb4b4', padding: '8px 10px', borderRadius: 6, margin: '10px auto', fontSize: 13, maxWidth: 640, textAlign: 'center' },
};

export default SalesHistory;
