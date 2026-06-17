// ============================================================
// pages/ArchiveDetail.jsx
// Full archive view for one completed session.
// Shows: session metadata, team results, presentation order,
// and complete Q&A challenge log per team.
// ============================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import axios from 'axios';

export default function ArchiveDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/archive/${id}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Layout><p className="text-white/30 text-center py-20">Loading archive...</p></Layout>;
  }
  if (!data) {
    return <Layout><p className="text-lab-red text-center py-20">Archive not found.</p></Layout>;
  }

  const { session, teams, draft_log } = data;

  // Group draft log by team
  const logByTeam = {};
  draft_log.forEach(entry => {
    if (!logByTeam[entry.team_id]) logByTeam[entry.team_id] = [];
    logByTeam[entry.team_id].push(entry);
  });

  const outcomeLabel = (entry) => {
    if (entry.correct) return { label: 'Correct', color: '#00e676' };
    if (entry.selected_idx === -1) return { label: 'Timeout', color: '#f0a500' };
    return { label: 'Wrong', color: '#ff3b5c' };
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-6">

        {/* Back */}
        <button onClick={() => navigate('/archives')} className="text-white/30 text-sm hover:text-white/60 transition-colors mb-6 block">
          ← Back to Archives
        </button>

        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6 border-teal-neon">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display font-bold text-white text-3xl">{session.label}</h2>
              <p className="text-white/40 mt-1">{session.date_label}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-lab-green uppercase tracking-widest bg-lab-green/10 border border-lab-green/30 px-2 py-0.5 rounded">
                Complete
              </span>
              <p className="text-white/30 text-xs mt-2">{session.difficulty} · {session.team_count} teams</p>
            </div>
          </div>
        </div>

        {/* Team Results Grid */}
        <h3 className="font-display font-semibold text-white/60 text-sm uppercase tracking-widest mb-3">
          Team Results
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {teams.map(team => (
            <div key={team.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-display font-bold text-white text-lg">{team.name}</p>
                  {team.present_order && (
                    <p className="text-white/40 text-xs mt-0.5">
                      Presented #{team.present_order}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lab-gold font-display font-bold text-2xl">
                    #{team.use_case_num}
                  </p>
                  <p className="text-white/30 text-xs">Use Case</p>
                </div>
              </div>
              {/* Strikes */}
              <div className="flex items-center gap-1 pt-2 border-t border-white/10">
                <span className="text-white/30 text-xs mr-1">Strikes:</span>
                {[0,1,2].map(i => (
                  <span key={i} className={i < team.strikes ? 'strike-pip' : 'strike-pip-empty'} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Q&A Challenge Log */}
        <h3 className="font-display font-semibold text-white/60 text-sm uppercase tracking-widest mb-3">
          Challenge Log
        </h3>
        <div className="space-y-4">
          {teams.map(team => {
            const logs = logByTeam[team.id] || [];
            if (logs.length === 0) return null;
            return (
              <div key={team.id} className="glass-card rounded-xl overflow-hidden">
                {/* Team header */}
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between"
                  style={{ background: 'rgba(0,212,200,0.05)' }}>
                  <span className="font-display font-semibold text-lab-teal">{team.name}</span>
                  <span className="text-white/30 text-xs">{logs.length} attempt{logs.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Attempt rows */}
                {logs.map((entry, i) => {
                  const outcome = outcomeLabel(entry);
                  return (
                    <div key={entry.id} className="px-5 py-4 border-b border-white/5 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/30 text-xs font-mono">Attempt {entry.attempt_num}</span>
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded uppercase tracking-wider"
                          style={{
                            color: outcome.color,
                            background: outcome.color + '20',
                            border: `1px solid ${outcome.color}40`,
                          }}
                        >
                          {outcome.label}
                        </span>
                      </div>

                      {/* Question */}
                      {entry.question && (
                        <p className="text-white/80 text-sm mb-3 leading-relaxed">{entry.question}</p>
                      )}

                      {/* Options */}
                      {entry.options && entry.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {entry.options.map((opt, idx) => (
                            <div
                              key={idx}
                              className="text-xs px-2 py-1.5 rounded"
                              style={{
                                background:
                                  idx === entry.correct_idx
                                    ? 'rgba(0,230,118,0.1)'
                                    : idx === entry.selected_idx && !entry.correct
                                    ? 'rgba(255,59,92,0.1)'
                                    : 'rgba(255,255,255,0.03)',
                                color:
                                  idx === entry.correct_idx
                                    ? '#00e676'
                                    : idx === entry.selected_idx && !entry.correct
                                    ? '#ff3b5c'
                                    : 'rgba(255,255,255,0.4)',
                                border: `1px solid ${
                                  idx === entry.correct_idx
                                    ? 'rgba(0,230,118,0.3)'
                                    : idx === entry.selected_idx && !entry.correct
                                    ? 'rgba(255,59,92,0.3)'
                                    : 'rgba(255,255,255,0.05)'
                                }`,
                              }}
                            >
                              <span className="opacity-50 mr-1">{['A','B','C','D'][idx]}.</span>
                              {opt}
                              {idx === entry.correct_idx && ' ✓'}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Use case assigned */}
                      {entry.use_case_num && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-white/30 text-xs">Assigned:</span>
                          <span className="text-lab-gold font-mono text-sm font-bold">
                            Use Case #{entry.use_case_num}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
