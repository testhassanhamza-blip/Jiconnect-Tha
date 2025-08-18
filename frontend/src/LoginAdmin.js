// src/LoginAdmin.js
import React, { useState } from 'react';
import axios from 'axios';

// 1) Essaie d'abord Vercel/Vite: VITE_API_BASE_URL
// 2) Puis CRA: REACT_APP_API_BASE
// 3) Sinon fallback sur Render (prod) avec /api
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE ||
  'https://jiconnect-backend.onrender.com/api';

function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });

      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user || {}));
        window.location.href = '/'; // change en '/dashboard' si tu as cette route
      } else {
        setErr('Réponse inattendue du serveur.');
      }
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 401) {
        setErr('Email ou mot de passe invalide.');
      } else {
        setErr("Impossible de joindre l'API. Vérifie l’URL API et le CORS.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Login</h1>
        <form onSubmit={onSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {err && <div style={styles.error}>{err}</div>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        {/* Indicateur pour vérifier l’URL API réellement utilisée */}
        <p style={styles.hint}>
          API: <code>{API_BASE}</code>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: '100vh',
    backgroundColor: '#0b0f1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 22,
    boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
    color: '#fff',
  },
  title: { marginTop: 0, marginBottom: 14, color: '#f5d042', textAlign: 'center' },
  input: {
    width: '100%', padding: 12, marginBottom: 12, borderRadius: 8,
    border: '1px solid #333', backgroundColor: '#0f172a', color: '#fff', fontSize: 14,
  },
  btn: {
    width: '100%', padding: 12, borderRadius: 8, border: 'none',
    backgroundColor: '#f5d042', color: '#0a174e', fontWeight: 'bold', cursor: 'pointer', fontSize: 15,
  },
  error: {
    backgroundColor: '#4b1d1d', color: '#ffb4b4', padding: '8px 10px',
    borderRadius: 6, marginBottom: 10, fontSize: 13,
  },
  hint: { marginTop: 10, fontSize: 12, color: '#9ca3af', textAlign: 'center' },
};

export default LoginAdmin;
