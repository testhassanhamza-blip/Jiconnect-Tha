import React, { useState, useEffect } from 'react';
import api from './api';

function SalesHistory() {
  const [ventes, setVentes] = useState([]);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('all');

  useEffect(() => {
    api.get('/ventes')
      .then(res => setVentes(res.data))
      .catch(err => console.error('Erreur chargement ventes', err));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const ventesFiltrees = ventes.filter((vente) => {
    const nomClient = vente.fullName || vente.nom || '';
    const numeroClient = vente.phoneNumber || vente.numero || '';
    const matchTexte =
      nomClient.toLowerCase().includes(search.toLowerCase()) ||
      numeroClient.includes(search);

    const venteDate = new Date(vente.date).toISOString().slice(0, 10);

    if (filtre === 'today' && venteDate !== today) return false;
    if (filtre === 'month' && !venteDate.startsWith(today.slice(0, 7))) return false;

    return matchTexte;
  });

  const totalVentes = ventesFiltrees.length;
  const totalMontant = ventesFiltrees.reduce((sum, v) => sum + (v.amount || v.montant || 0), 0);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Historia ya mauzo (Sales History)</h1>

      {/* Stats */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Jumla ya Mauzo</h3>
          <p style={styles.statValue}>{totalVentes}</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Mapato yote (TZS)</h3>
          <p style={styles.statValue}>{totalMontant}</p>
        </div>
      </div>

      {/* Recherche + filtre */}
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
        </select>
      </div>

      {/* Cartes */}
      <div style={styles.grid}>
        {ventesFiltrees.length === 0 ? (
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
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '30px', backgroundColor: '#0b0f1a', minHeight: '100vh', color: '#ffffff', fontFamily: 'Segoe UI, sans-serif' },
  title: { fontSize: '24px', color: '#f5d042', textAlign: 'center', marginBottom: '20px' },
  statsContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' },
  statCard: { backgroundColor: '#111827', padding: '20px', borderRadius: '10px', width: '180px', textAlign: 'center', boxShadow: '0 3px 6px rgba(0,0,0,0.2)' },
  statTitle: { fontSize: '14px', color: '#ffffff', marginBottom: '6px' },
  statValue: { fontSize: '22px', color: '#f5d042', fontWeight: 'bold' },
  controls: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', justifyContent: 'center' },
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #444', width: '260px', backgroundColor: '#111827', color: '#fff' },
  select: { padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#111827', color: '#fff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' },
  card: { backgroundColor: '#111827', padding: '14px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', fontSize: '14px', lineHeight: '1.4em' },
  name: { color: '#f5d042', marginBottom: '6px', fontSize: '16px' },
  link: { marginTop: '8px', display: 'inline-block', color: '#f5d042', fontWeight: 'bold', textDecoration: 'underline', fontSize: '13px' },
  empty: { textAlign: 'center', color: '#ccc', gridColumn: '1 / -1', marginTop: '20px' },
};

export default SalesHistory;
