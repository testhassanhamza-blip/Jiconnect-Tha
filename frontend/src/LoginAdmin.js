import React, { useState } from 'react';
import axios from 'axios';

function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      window.location.href = '/'; // vers le dashboard
    } catch (e) {
      setErr('Email au mot de passe invalide');
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
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div style={styles.error}>{err}</div>}
          <button style={styles.btn} type="submit">Se connecter</button>
        </form>
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
  title: {
    marginTop: 0,
    marginBottom: 14,
    color: '#f5d042',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: '1px solid #333',
    backgroundColor: '#0f172a',
    color: '#fff',
    fontSize: 14,
  },
  btn: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#f5d042',
    color: '#0a174e',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: 15,
  },
  error: {
    backgroundColor: '#4b1d1d',
    color: '#ffb4b4',
    padding: '8px 10px',
    borderRadius: 6,
    marginBottom: 10,
    fontSize: 13,
  },
};

export default LoginAdmin;
