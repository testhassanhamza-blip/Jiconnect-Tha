// frontend/src/Profile.js
import React, { useEffect, useState } from 'react';
import api from './api';

function Profile() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    setMsg({ type: '', text: '' });
    api.get('/auth/me')
      .then(res => setEmail(res.data.email || ''))
      .catch(() => setMsg({ type: 'error', text: 'Impossible de récupérer le profil.' }))
      .finally(() => setLoading(false));
  }, []);

  const onChangePwd = (e) => {
    const { name, value } = e.target;
    setPwd(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!pwd.currentPassword || !pwd.newPassword || !pwd.confirm) {
      return setMsg({ type: 'error', text: 'Remplis tous les champs.' });
    }
    if (pwd.newPassword.length < 6) {
      return setMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }
    if (pwd.newPassword !== pwd.confirm) {
      return setMsg({ type: 'error', text: 'La confirmation ne correspond pas.' });
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      const text = err?.response?.data?.error || 'Erreur lors du changement de mot de passe.';
      setMsg({ type: 'error', text });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Mon compte</h1>
          <p style={{ color: '#aaa' }}>Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerWrap}>
        <h1 style={styles.title}>Mon compte</h1>
        <p style={styles.subtitle}>Gérer les informations du profil et la sécurité (Admin)</p>
      </div>

      {/* Grille principale */}
      <div style={styles.grid}>
        {/* Bloc infos compte */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Informations du profil</h2>
          <div style={styles.row}>
            <div style={styles.label}>Email (Admin)</div>
            <div style={styles.value}>{email}</div>
          </div>
          <div style={{ marginTop: 12, color: '#aaa', fontSize: 13 }}>
            L’email sert d’identifiant de connexion à votre espace d’administration.
          </div>
        </section>

        {/* Bloc sécurité / changement mot de passe */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Sécurité — Changer le mot de passe</h2>
          {msg.text ? (
            <div
              style={{
                ...styles.alert,
                backgroundColor: msg.type === 'success' ? '#17331e' : '#402121',
                color: msg.type === 'success' ? '#9af5b6' : '#ffb8b8',
                borderColor: msg.type === 'success' ? '#2f7d46' : '#8a3a3a',
              }}
            >
              {msg.text}
            </div>
          ) : null}

          <form onSubmit={handleChangePassword}>
            <div style={styles.formRow}>
              <label style={styles.formLabel}>Mot de passe actuel</label>
              <input
                name="currentPassword"
                type="password"
                value={pwd.currentPassword}
                onChange={onChangePwd}
                placeholder="••••••"
                style={styles.input}
              />
            </div>

            <div style={styles.formRow}>
              <label style={styles.formLabel}>Nouveau mot de passe</label>
              <input
                name="newPassword"
                type="password"
                value={pwd.newPassword}
                onChange={onChangePwd}
                placeholder="Au moins 6 caractères"
                style={styles.input}
              />
            </div>

            <div style={styles.formRow}>
              <label style={styles.formLabel}>Confirmer le nouveau</label>
              <input
                name="confirm"
                type="password"
                value={pwd.confirm}
                onChange={onChangePwd}
                placeholder="Retape le nouveau mot de passe"
                style={styles.input}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" style={styles.primaryBtn}>Enregistrer</button>
              <button type="button" onClick={() => setPwd({ currentPassword: '', newPassword: '', confirm: '' })} style={styles.secondaryBtn}>
                Annuler
              </button>
            </div>
          </form>
        </section>

        {/* Bloc actions rapides */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Actions</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleLogout} style={styles.dangerBtn}>Déconnexion</button>
          </div>
          <div style={{ marginTop: 10, color: '#aaa', fontSize: 13 }}>
            La déconnexion efface le token sur cet appareil et vous renvoie à la page de connexion.
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0b0f1a',
    color: '#fff',
    padding: 20,
    fontFamily: 'Segoe UI, sans-serif',
    boxSizing: 'border-box',
  },
  headerWrap: {
    maxWidth: 980,
    margin: '0 auto 14px',
    padding: '0 4px',
  },
  title: { margin: 0, color: '#f5d042', fontSize: 24 },
  subtitle: { marginTop: 6, color: '#bcbcbc', fontSize: 14 },

  grid: {
    maxWidth: 980,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: 16,
  },

  card: {
    gridColumn: 'span 12',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 18,
    boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
  },
  cardTitle: { marginTop: 0, marginBottom: 12, fontSize: 16, color: '#ffffff' },

  row: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    border: '1px solid #1f2937',
    borderRadius: 8,
    padding: '12px 14px',
    alignItems: 'center',
    gap: 10,
  },
  label: { color: '#cfcfcf', fontSize: 13 },
  value: { color: '#fff', fontWeight: '600' },

  alert: {
    border: '1px solid',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 10,
    fontSize: 13,
  },

  formRow: { marginBottom: 10, display: 'flex', flexDirection: 'column' },
  formLabel: { marginBottom: 6, color: '#dddddd', fontSize: 13 },
  input: {
    backgroundColor: '#0f172a',
    color: '#fff',
    border: '1px solid #2a364a',
    borderRadius: 8,
    padding: '10px 12px',
    outline: 'none',
    fontSize: 14,
  },

  primaryBtn: {
    backgroundColor: '#f5d042',
    color: '#0a174e',
    border: 'none',
    borderRadius: 8,
    padding: '10px 14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: '#1f2937',
    color: '#ffffff',
    border: '1px solid #2a364a',
    borderRadius: 8,
    padding: '10px 14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: 14,
  },
  dangerBtn: {
    backgroundColor: '#2b1d1d',
    color: '#ffb4b4',
    border: '1px solid #693939',
    borderRadius: 8,
    padding: '10px 14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: 14,
  },

  // Responsive : en desktop, on répartit les cartes sur 2 colonnes
  '@media (min-width: 900px)': {},
};

// petite astuce pour grilles responsives via inline styles (fallback simple)
const origGrid = styles.grid;
styles.grid = {
  ...origGrid,
  ...(window.innerWidth >= 900
    ? { gridTemplateColumns: 'repeat(12, 1fr)' }
    : { gridTemplateColumns: 'repeat(12, 1fr)' }),
};
const origCard = styles.card;
styles.card = {
  ...origCard,
  ...(window.innerWidth >= 900 ? { gridColumn: 'span 6' } : { gridColumn: 'span 12' }),
};

export default Profile;
