import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import SalesHistory from './SalesHistory';
import ConnectedUsers from './ConnectedUsers';
import Navbar from './Navbar';
import LoginAdmin from './LoginAdmin';
import RequireAuth from './RequireAuth';
import Profile from './Profile';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      {token && <Navbar />}

      <Routes>
        <Route path="/login" element={<LoginAdmin />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/ventes"
          element={
            <RequireAuth>
              <SalesHistory />
            </RequireAuth>
          }
        />
        <Route
          path="/utilisateurs"
          element={
            <RequireAuth>
              <ConnectedUsers />
            </RequireAuth>
          }
        />
        <Route
          path="/profil"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
