import React, { useState, useEffect } from 'react';
import DashboardChart from './DashboardChart';
import { useNavigate } from 'react-router-dom';
import api from './api';

function Dashboard() {
  const [filtre, setFiltre] = useState('all');
  const [routerStatus, setRouterStatus] = useState(null);
  const navigate = useNavigate();

  const actualiserDashboard = () => {
    setRouterStatus(null);
    api.get('/router/status')
      .then(res => setRouterStatus(res.data.online))
      .catch(() => setRouterStatus(false));
  };

  useEffect(() => {
    actualiserDashboard();
  }, []);

  const toutesLesVentes = [
    { nom: "Kassongo M.", numero: "+255 717 000 123", forfait: "1 DAY", montant: 1000, date: "2025-08-05 12:00", receiptUrl: "/receipts/2025-08-05_Kassongo.pdf" },
    { nom: "Mariam J.", numero: "+255 716 999 456", forfait: "7 DAYS", montant: 6500, date: "2025-08-06 14:25", receiptUrl: "/receipts/2025-08-06_Mariam.pdf" },
  ];

  const today = new Date().toISOString().slice(0, 10);
  const ventesFiltrees = toutesLesVentes.filter((vente) => {
    const venteDate = vente.date.slice(0, 10);
    if (filtre === 'today') return venteDate === today;
    if (filtre === 'month') return venteDate.slice(0, 7) === today.slice(0, 7);
    return true;
  });

  const totalMontant = ventesFiltrees.reduce((sum, vente) => sum + vente.montant, 0);
  const totalVentes = ventesFiltrees.length;

  return (
    <div style={styles.container}>
      {/* Bandeau haut */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashibodi ya Jiconnect</h1>
          <p style={styles.subtitle}>Muhtasari wa mauzo na hali ya router</p>
        </div>
        <button onClick={actualiserDashboard} style={styles.refreshBtn}>🔄 Actualiser</button>
      </div>

      {/* Statut routeur */}
      <div style={styles.routerStatus}>
        <span style={{ fontWeight: '500' }}>Statut du routeur :</span>
        <span style={{
          backgroundColor: routerStatus === true ? '#00c851' : '#ff4444',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {routerStatus === true ? 'En ligne' : routerStatus === false ? 'Hors ligne' : 'Chargement...'}
        </span>
      </div>

      {/* Filtres */}
      <div style={styles.filtres}>
        <button onClick={() => setFiltre('today')} style={filtre === 'today' ? styles.activeBtn : styles.btn}>Leo</button>
        <button onClick={() => setFiltre('month')} style={filtre === 'month' ? styles.activeBtn : styles.btn}>Mwezi huu</button>
        <button onClick={() => setFiltre('all')} style={filtre === 'all' ? styles.activeBtn : styles.btn}>Zote</button>
      </div>

      {/* Résumés */}
      <div style={styles.summaryContainer}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Forfaits zilizouzwa</h2>
          <p style={styles.number}>{totalVentes}</p>
        </div>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Mapato (TZS)</h2>
          <p style={styles.number}>{totalMontant}</p>
        </div>
      </div>

      {/* Graphique */}
      <div style={styles.graphWrapper}>
        <DashboardChart />
      </div>

      {/* Historique */}
      <div style={styles.footer}>
        <button onClick={() => navigate('/ventes')} style={styles.historyBtn}>
          Tazama historia yote ya mauzo
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#0b0f1a', color: '#ffffff', minHeight: '100vh', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '20px', gap: '15px' },
  title: { fontSize: '24px', color: '#f5d042', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#ccc', margin: 0 },
  refreshBtn: { backgroundColor: '#f5d042', color: '#0a174e', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  routerStatus: { backgroundColor: '#111827', padding: '12px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '400px', margin: '0 auto 25px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' },
  filtres: { display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '25px', flexWrap: 'wrap' },
  btn: { backgroundColor: '#1f2937', color: '#ffffff', border: '1px solid #444', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  activeBtn: { backgroundColor: '#f5d042', color: '#0a174e', fontWeight: 'bold', padding: '10px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px' },
  summaryContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' },
  card: { backgroundColor: '#111827', padding: '20px', borderRadius: '10px', width: '220px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' },
  cardTitle: { fontSize: '15px', marginBottom: '8px' },
  number: { fontSize: '22px', fontWeight: 'bold', color: '#f5d042' },
  graphWrapper: { backgroundColor: '#111827', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', marginBottom: '30px' },
  footer: { display: 'flex', justifyContent: 'center' },
  historyBtn: { backgroundColor: '#f5d042', color: '#0a174e', padding: '12px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
};

export default Dashboard;
