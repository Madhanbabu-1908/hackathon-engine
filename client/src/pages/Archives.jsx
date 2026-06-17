// ============================================================
// pages/Archives.jsx
// Lists all completed sessions for historical review.
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import axios from 'axios';

export default function Archives() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axios.get('/api/archive')
      .then(r => { setSessions(r.data.sessions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-6">
        <div className="mb-8">
          <button onClick={() => navigate('/')} className="text-white/30 text-sm hover:text-white/60 transition-colors mb-4 block">
            ← Back
          </button>
          <h2 className="font-display font-bold text-white text-3xl">
            Session <span className="text-lab-purple" style={{ color: 'rgba(167,139,250,1)' }}>Archives</span>
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Past hackathon sessions — {sessions.length} completed.
          </p>
        </div>

        {loading && <p className="text-white/30 text-center py-10">Loading archives...</p>}

        {!loading && sessions.length === 0 && (
          <div className="glass-card rounded-xl p-10 text-center">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-white/40 font-body">No completed sessions yet.</p>
            <p className="text-white/20 text-sm mt-1">Sessions appear here once finalized.</p>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => navigate(`/archives/${s.id}`)}
              className="w-full text-left glass-card rounded-xl p-5 transition-all duration-200"
              style={{ border: '1px solid rgba(124,58,237,0.2)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold text-white text-lg">{s.label}</p>
                  <p className="text-white/40 text-sm mt-0.5">{s.date_label}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-white/30 text-xs">{s.team_count} teams</span>
                    <span className="text-white/30 text-xs">·</span>
                    <span className="text-white/30 text-xs">{s.difficulty}</span>
                    <span className="text-white/30 text-xs">·</span>
                    <span className="text-white/30 text-xs">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="text-white/20 text-2xl">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
