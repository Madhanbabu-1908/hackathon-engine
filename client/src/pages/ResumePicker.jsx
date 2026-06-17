import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import axios from 'axios';

export default function ResumePicker() {
  const navigate = useNavigate();
  const [params]   = useSearchParams();
  const type       = params.get('type'); // 'draft' | 'eval' | null (show all)
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    axios.get('/api/sessions/incomplete')
      .then(r => {
        let all = r.data.sessions || [];
        if (type === 'draft') all = all.filter(s => ['SETUP','DRAFT'].includes(s.phase));
        if (type === 'eval')  all = all.filter(s => s.phase === 'EVALUATION');
        setSessions(all);
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const routeToPhase = (s) => {
    const routes = { SETUP: `/session/${s.id}/draft`, DRAFT: `/session/${s.id}/draft`, EVALUATION: `/session/${s.id}/evaluation` };
    navigate(routes[s.phase] || `/session/${s.id}/draft`);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this session? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete session.');
    } finally {
      setDeleting(null);
    }
  };

  const phaseLabel = (p) => ({ SETUP:'Setup Complete', DRAFT:'Draft In Progress', EVALUATION:'Evaluation Mode' }[p] || p);
  const phaseColor = (p) => ({ SETUP:'#00d4c8', DRAFT:'#f0a500', EVALUATION:'rgba(167,139,250,1)' }[p] || '#fff');

  const title = type === 'draft' ? 'Use Case Selection' : type === 'eval' ? 'Evaluation' : 'Resume Session';

  return (
    <Layout>
      <div className="max-w-xl mx-auto py-6">
        <button onClick={() => navigate('/')} className="text-white/30 text-sm hover:text-white/60 transition-colors mb-4 block">
          ← Back
        </button>
        <div className="mb-8">
          <h2 className="font-display font-bold text-white text-3xl">
            Resume <span className="text-lab-teal">{title}</span>
          </h2>
          <p className="text-white/40 text-sm mt-1">{sessions.length} session{sessions.length !== 1 ? 's' : ''} found.</p>
        </div>

        {loading && <p className="text-white/30 text-center py-10">Loading...</p>}

        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} onClick={() => routeToPhase(s)}
              className="w-full text-left glass-card rounded-xl p-5 border-teal-neon hover:bg-lab-teal/5 transition-all duration-200 cursor-pointer relative group">
              <div className="flex items-start justify-between pr-10">
                <div>
                  <p className="font-display font-semibold text-white text-lg">{s.label}</p>
                  <p className="text-white/40 text-sm mt-0.5">{s.date_label}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ color: phaseColor(s.phase), background: phaseColor(s.phase)+'20', border:`1px solid ${phaseColor(s.phase)}40` }}>
                      {phaseLabel(s.phase)}
                    </span>
                    <span className="text-white/30 text-xs">{s.team_count} teams</span>
                    {s.difficulty !== 'N/A' && <span className="text-white/30 text-xs">{s.difficulty}</span>}
                  </div>
                </div>
                <div className="text-right text-white/30">
                  <p className="text-xs font-mono">Last updated</p>
                  <p className="text-xs mt-0.5">{new Date(s.updated_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={e => handleDelete(e, s.id)}
                disabled={deleting === s.id}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded text-xs font-mono uppercase"
                style={{ background:'rgba(255,59,92,0.15)', border:'1px solid rgba(255,59,92,0.4)', color:'#ff3b5c' }}>
                {deleting === s.id ? '...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>

        {!loading && sessions.length === 0 && (
          <div className="glass-card rounded-xl p-10 text-center">
            <p className="text-white/40">No sessions found.</p>
            <button onClick={() => navigate('/')} className="mt-4 text-lab-teal text-sm underline">Go Home</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
