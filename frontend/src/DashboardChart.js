import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const data = [
  { date: '2025-08-01', montant: 5000 },
  { date: '2025-08-02', montant: 8000 },
  { date: '2025-08-03', montant: 15000 },
  { date: '2025-08-04', montant: 2000 },
  { date: '2025-08-05', montant: 12000 },
];

function DashboardChart() {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Revenus quotidiens</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="montant" fill="#f5d042" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  container: {
    marginTop: '30px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
  },
  title: {
    color: '#0a174e',
    fontSize: '18px',
    marginBottom: '15px',
  },
};

export default DashboardChart;