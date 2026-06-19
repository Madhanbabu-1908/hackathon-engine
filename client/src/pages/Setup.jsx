import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { rgba } from '../theme.js';
import axios from 'axios';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function Setup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isEval   = params.get('mode') === 'eval';

  const [label,      setLabel]      = useState(isEval ? 'AI Hackathon Evaluation Batch - ' : 'AI Hackathon Batch - ');
  const [dateLabel,  setDateLabel]  = useState(new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }));
  const [teamCount,  setTeamCount]  = useState(4);
  const [teamNames,  setTeamNames]  = useState(['','','','']);
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading,    setLoading]    = useState(false);
  const [status,     setStatus]     = useState('');
  const [error,      setError]      = useState('');

  const handleCountChange = count => {
    setTeamCount(count);
    setTeamNames(prev => { const n=[...prev]; while(n.length<count) n.push(''); return n.slice(0,count); });
  };

  const handleInitialize = async () => {
    if (!label.trim() || !dateLabel.trim()) { setError('Please enter session label and date.'); return; }
    const names = teamNames.slice(0,teamCount).map(n=>n.trim());
    if (names.some(n=>!n)) { setError('Please enter all team names.'); return; }
    if (new Set(names).size !== names.length) { setError('Team names must be unique.'); return; }
    setError(''); setLoading(true);
    try {
      setStatus('Creating session...');
      const { data } = await axios.post('/api/sessions/create', {
        label:label.trim(), date_label:dateLabel.trim(), difficulty:isEval?'N/A':difficulty, teams:names });
      const id = data.session_id;
      if (isEval) {
        setStatus('Setting up evaluation...');
        await axios.patch(`/api/sessions/${id}/phase`, { phase:'EVALUATION' });
        setTimeout(() => navigate(`/session/${id}/evaluation`), 500);
      } else {
        setStatus('Generating questions via TCS LLM — please wait...');
        await axios.post('/api/questions/generate', { session_id:id, difficulty });
        await axios.patch(`/api/sessions/${id}/phase`, { phase:'DRAFT' });
        setTimeout(() => navigate(`/session/${id}/draft`), 500);
      }
    } catch(err) { setError(err.response?.data?.error||'Initialization failed.'); setLoading(false); setStatus(''); }
  };

  const accentColor = isEval ? 'purple' : 'teal';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-4">
        <button onClick={() => navigate('/')} className="text-white/30 text-sm hover:text-white/60 transition-colors mb-4 block">← Back</button>
        <div className="mb-8">
          <h2 className="font-display font-bold text-white text-3xl">
            {isEval ? 'Evaluation' : 'Use Case Selection'} <span style={{ color:rgba('teal',1) }}>Setup</span>
          </h2>
          <p className="text-white/40 text-sm mt-1">{isEval ? 'Configure teams for presentation order draw.' : 'Configure session before launching the spin wheel.'}</p>
        </div>
        <div className="space-y-6">

          <div className="glass-card rounded-xl p-5">
            <label className="block text-xs font-mono uppercase tracking-widest mb-3" style={{ color:rgba('teal',1) }}>Session Label</label>
            <input type="text" value={label} onChange={e=>setLabel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body text-sm focus:outline-none transition-colors mb-3"
              style={{ '--tw-ring-color':rgba('teal',0.6) }} onFocus={e=>e.target.style.borderColor=rgba('teal',0.6)} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'} />
            <input type="text" value={dateLabel} onChange={e=>setDateLabel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body text-sm focus:outline-none transition-colors"
              onFocus={e=>e.target.style.borderColor=rgba('teal',0.6)} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'} />
          </div>

          {!isEval && (
            <div className="glass-card rounded-xl p-5">
              <label className="block text-xs font-mono uppercase tracking-widest mb-3" style={{ color:rgba('teal',1) }}>Question Difficulty</label>
              <div className="flex gap-3">
                {DIFFICULTIES.map(d => {
                  const dc = d==='Easy'?'green':d==='Medium'?'gold':'red';
                  return (
                    <button key={d} onClick={()=>setDifficulty(d)} className="flex-1 py-3 rounded-lg font-display font-semibold text-sm uppercase tracking-wider transition-all duration-200"
                      style={{ background:difficulty===d?rgba(dc,0.2):'rgba(255,255,255,0.05)', border:`1px solid ${difficulty===d?rgba(dc,0.5):'rgba(255,255,255,0.1)'}`, color:difficulty===d?rgba(dc,1):'rgba(255,255,255,0.4)' }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl p-5">
            <label className="block text-xs font-mono uppercase tracking-widest mb-3" style={{ color:rgba('teal',1) }}>Number of Teams</label>
            <div className="flex gap-2">
              {[2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} onClick={()=>handleCountChange(n)} className="flex-1 py-3 rounded-lg font-display font-bold text-xl transition-all duration-200"
                  style={{ background:teamCount===n?rgba('teal',0.2):'rgba(255,255,255,0.05)', border:`1px solid ${teamCount===n?rgba('teal',0.6):'rgba(255,255,255,0.1)'}`, color:teamCount===n?rgba('teal',1):'rgba(255,255,255,0.4)', boxShadow:teamCount===n?`0 0 15px ${rgba('teal',0.2)}`:'none' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <label className="block text-xs font-mono uppercase tracking-widest mb-3" style={{ color:rgba('teal',1) }}>Team Names</label>
            <div className="space-y-3">
              {Array.from({length:teamCount}).map((_,i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-mono text-sm w-6 text-right" style={{ color:rgba('teal',0.4) }}>{i+1}</span>
                  <input type="text" value={teamNames[i]||''} onChange={e=>setTeamNames(prev=>prev.map((n,j)=>j===i?e.target.value:n))}
                    placeholder={`Team ${i+1} name`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body text-sm focus:outline-none transition-colors"
                    onFocus={e=>e.target.style.borderColor=rgba('teal',0.6)} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'} />
                </div>
              ))}
            </div>
          </div>

          {error  && <div className="border-red-neon rounded-lg px-4 py-3 bg-red/10"><p className="text-sm" style={{ color:rgba('red',1) }}>{error}</p></div>}
          {status && <div className="border-teal-neon rounded-lg px-4 py-3"><p className="text-sm flex items-center gap-2" style={{ color:rgba('teal',1) }}><span className="animate-spin">⟳</span>{status}</p></div>}

          <button onClick={handleInitialize} disabled={loading} className="w-full py-4 rounded-xl font-display font-bold text-xl uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
            style={{ background:`linear-gradient(135deg, ${rgba(accentColor,0.3)}, ${rgba(accentColor,0.1)})`, border:`1px solid ${rgba(accentColor,0.6)}`, color:rgba(accentColor,1), boxShadow:loading?'none':`0 0 30px ${rgba(accentColor,0.2)}` }}>
            {loading ? 'Initializing...' : isEval ? '🏆 Initialize Evaluation' : '⚡ Initialize Engine'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
