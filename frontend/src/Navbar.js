import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const linkStyle = (path) => ({
    padding: '10px 16px',
    color: location.pathname === path ? '#0a174e' : '#ffffff',
    backgroundColor: location.pathname === path ? '#f5d042' : 'transparent',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    transition: '0.3s',
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>Jiconnect</div>

      <div style={styles.right}>
        <div style={styles.links}>
          <Link to="/" style={linkStyle('/')}>Dashboard</Link>
          <Link to="/ventes" style={linkStyle('/ventes')}>Mauzo</Link>
          <Link to="/utilisateurs" style={linkStyle('/utilisateurs')}>Watumiaji Hai</Link>
          <Link to="/profil" style={linkStyle('/profil')}>Profil</Link>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#0a174e',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  brand: {
    color: '#f5d042',
    fontWeight: 'bold',
    fontSize: '20px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  links: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  logoutBtn: {
    backgroundColor: '#f5d042',
    color: '#0a174e',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default Navbar;
