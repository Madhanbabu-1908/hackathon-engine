import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { rgba } from '../theme.js';
import axios from 'axios';

export default function Home() {
  const navigate = useNavigate();
  const [draftSessions, setDraftSessions] = useState([]);
  const [evalSessions,  setEvalSessions]  = useState([]);
  const [deleting,      setDeleting]      = useState(false);

  const load = () => {
    axios.get('/api/sessions/incomplete').then(r => {
      const all = r.data.sessions || [];
      setDraftSessions(all.filter(s => ['SETUP','DRAFT','ACTIVE'].includes(s.phase)));
      setEvalSessions(all.filter(s => s.phase === 'EVALUATION'));
    }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const routeToPhase = (s) => {
    const routes = { SETUP:`/session/${s.id}/draft`, DRAFT:`/session/${s.id}/draft`, ACTIVE:`/session/${s.id}/active`, EVALUATION:`/session/${s.id}/evaluation` };
    navigate(routes[s.phase] || `/session/${s.id}/draft`);
  };

  const handleUseCaseClick = () => {
    if (draftSessions.length === 1) { routeToPhase(draftSessions[0]); return; }
    if (draftSessions.length > 1)   { navigate('/resume?type=draft'); return; }
    navigate('/setup?mode=draft');
  };

  const handleEvalClick = () => {
    if (evalSessions.length === 1) { routeToPhase(evalSessions[0]); return; }
    if (evalSessions.length > 1)   { navigate('/resume?type=eval'); return; }
    navigate('/setup?mode=eval');
  };

  const handleDelete = async (sessions) => {
    if (!window.confirm(`Delete "${sessions[0]?.label}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await axios.delete(`/api/sessions/${sessions[0].id}`); load(); }
    catch { alert('Failed to delete.'); }
    finally { setDeleting(false); }
  };

  const SessionButton = ({ sessions, onClick, onDelete, colorKey, icon, title, subtitle }) => {
    const hasOne  = sessions.length === 1;
    const hasMany = sessions.length > 1;
    const isActive = sessions.length > 0;
    return (
      <div className="relative w-full">
        <button onClick={onClick} className="w-full rounded-xl px-8 py-4 font-display font-semibold text-lg tracking-widest uppercase transition-all duration-300 text-left"
          style={{ background: rgba(colorKey, 0.08), border:`1px solid ${rgba(colorKey, 0.4)}`, color: rgba(colorKey, 1) }}
          onMouseEnter={e => { e.currentTarget.style.background=rgba(colorKey,0.18); e.currentTarget.style.boxShadow=`0 0 30px ${rgba(colorKey,0.25)}`; }}
          onMouseLeave={e => { e.currentTarget.style.background=rgba(colorKey,0.08); e.currentTarget.style.boxShadow='none'; }}>
          <span className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            {title}
            {hasMany && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:rgba(colorKey,0.3), color:rgba(colorKey,1) }}>{sessions.length} active</span>}
          </span>
          <p className="text-xs font-body font-normal normal-case tracking-normal mt-1" style={{ color:rgba(colorKey,0.5) }}>
            {isActive ? (hasMany ? 'Multiple sessions — pick one' : `Resume: ${sessions[0].label}`) : subtitle}
          </p>
        </button>
        {hasOne && (
          <button onClick={() => onDelete(sessions)} disabled={deleting}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all duration-200"
            style={{ background:rgba('red',0.12), border:`1px solid ${rgba('red',0.35)}`, color:rgba('red',1) }}
            onMouseEnter={e => e.currentTarget.style.background=rgba('red',0.25)}
            onMouseLeave={e => e.currentTarget.style.background=rgba('red',0.12)}>
            {deleting ? '...' : '🗑 Clear'}
          </button>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[75vh]">
        <div className="text-center mb-12 animate-float">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-16" style={{ background:`linear-gradient(to right, transparent, ${rgba('teal',0.6)})` }} />
            <span className="text-xs font-mono tracking-[0.3em] uppercase" style={{ color:rgba('teal',0.6) }}>Co-Creators</span>
            <div className="h-px w-16" style={{ background:`linear-gradient(to left, transparent, ${rgba('teal',0.6)})` }} />
          </div>
          <h1 className="font-display font-bold text-white leading-none mb-2" style={{ fontSize:'clamp(2.5rem,6vw,4.5rem)' }}>
            AI Friday's Hackathon
            <span className="block animate-glow-teal" style={{ color:rgba('teal',1) }}>Orchestration Engine</span>
          </h1>
          <p className="text-white/40 font-body text-base mt-4 tracking-widest uppercase">
            where you can &nbsp;—&nbsp; Learn, Prompt & Co-Create
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">   
            {[...Array(5)].map((_,i) => (
              <div key={i} className="h-0.5 rounded" style={{ width:i===2?40:i===1||i===3?24:12, background:rgba('teal',0.3) }} />
            ))}
          </div>
        </div>

        <div className="w-full max-w-md space-y-3">
          <SessionButton sessions={draftSessions} onClick={handleUseCaseClick} onDelete={handleDelete}
            colorKey="teal" icon="🎯" title="Use Case Selection" subtitle="Spin wheel · MCQ challenge · Assign use cases" />
          <SessionButton sessions={evalSessions} onClick={handleEvalClick} onDelete={handleDelete}
            colorKey="purple" icon="🏆" title="Evaluation" subtitle="Spin wheel · Determine presentation order" />
          <div className="teal-divider my-2" />
          <button onClick={() => navigate('/archives')} className="w-full rounded-xl px-8 py-3 font-display font-semibold text-base tracking-widest uppercase transition-all duration-300"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.color='rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}>
            <span className="flex items-center justify-center gap-3"><span>📁</span> Archives</span>
          </button>
        </div>
        <div className="mt-12">
          <p className="text-white/15 text-xs font-mono tracking-[0.25em] uppercase">TCS GenAI Lab · Coimbatore · Co-Creators Team</p>
        </div>
      </div>
    </Layout>
  );
}
