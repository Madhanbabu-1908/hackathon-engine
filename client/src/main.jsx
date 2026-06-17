import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import { theme } from './theme.js';
import { getCredentials } from './utils/credentials.js';

// Inject theme CSS variables
const root = document.documentElement;
root.style.setProperty('--bg',        theme.bg);
root.style.setProperty('--bg-card',   theme.bgCard);
root.style.setProperty('--teal',      theme.teal);
root.style.setProperty('--gold',      theme.gold);
root.style.setProperty('--purple',    theme.purple);
root.style.setProperty('--red',       theme.red);
root.style.setProperty('--green',     theme.green);
root.style.setProperty('--scrollbar', theme.scrollbar);
document.body.style.backgroundColor = theme.bg;

// ── Protected Route ──────────────────────────────────────────
// Checks sessionStorage for credentials.
// If found, sets axios headers so every API call forwards them.
// If not found, redirects to /login.
function ProtectedRoute({ children }) {
  const creds = getCredentials();
  if (!creds) return <Navigate to="/login" replace />;

  // Set credentials as axios default headers — forwarded to backend
  axios.defaults.headers.common['x-api-key']  = creds.apiKey;
  axios.defaults.headers.common['x-base-url'] = creds.baseUrl;
  axios.defaults.headers.common['x-model']    = creds.model;

  return children;
}

import Login          from './pages/Login.jsx';
import Home           from './pages/Home.jsx';
import Setup          from './pages/Setup.jsx';
import SpinWheel      from './pages/SpinWheel.jsx';
import Challenge      from './pages/Challenge.jsx';
import HackathonActive from './pages/HackathonActive.jsx';
import Evaluation     from './pages/Evaluation.jsx';
import Archives       from './pages/Archives.jsx';
import ArchiveDetail  from './pages/ArchiveDetail.jsx';
import ResumePicker   from './pages/ResumePicker.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — requires credentials in sessionStorage */}
        <Route path="/"                       element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/setup"                  element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route path="/resume"                 element={<ProtectedRoute><ResumePicker /></ProtectedRoute>} />
        <Route path="/session/:id/draft"      element={<ProtectedRoute><SpinWheel /></ProtectedRoute>} />
        <Route path="/session/:id/challenge"  element={<ProtectedRoute><Challenge /></ProtectedRoute>} />
        <Route path="/session/:id/active"     element={<ProtectedRoute><HackathonActive /></ProtectedRoute>} />
        <Route path="/session/:id/evaluation" element={<ProtectedRoute><Evaluation /></ProtectedRoute>} />
        <Route path="/archives"               element={<ProtectedRoute><Archives /></ProtectedRoute>} />
        <Route path="/archives/:id"           element={<ProtectedRoute><ArchiveDetail /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
