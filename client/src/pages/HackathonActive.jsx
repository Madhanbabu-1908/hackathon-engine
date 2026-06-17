import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { rgba } from '../theme.js';
import axios from 'axios';

export default function HackathonActive() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [teams,   setTeams]   = useState([]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    axios.get(`/api/sessions/${sessionId}`).then(r => { setSession(r.data.session); setTeams(r.data.teams); });
    const ticker = setInterval(() => setElapsed(e=>e+1), 1000);
    return () => clearInterval(ticker);
  }, [sessionId]);

  const formatElapsed = s => {
    const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
    return h>0?`${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`:`${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
  };

  const handleEvaluation = async () => {
    await axios.patch(`/api/sessions/${sessionId}/phase`, { phase:'EVALUATION' });
    navigate(`/session/${sessionId}/evaluation`);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-4">
        <button onClick={() => navigate(-1)} className="text-white/30 text-sm hover:text-white/60 transition-colors mb-4 block">← Back</button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor:rgba('green',1) }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color:rgba('green',1) }}>Hackathon In Progress</span>
          </div>
          <h2 className="font-display font-bold text-white text-3xl">{session?.label}</h2>
          <p className="text-white/40 text-sm mt-1">{session?.date_label}</p>
          <div className="mt-4 inline-block glass-card rounded-xl px-8 py-3 border-teal-neon">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-1">Time Elapsed</p>
            <p className="font-display font-bold text-4xl tabular-nums" style={{ color:rgba('teal',1) }}>{formatElapsed(elapsed)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {teams.map((team,i) => (
            <div key={team.id} className="glass-card rounded-xl p-5 border-teal-neon">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-1">Team {i+1}</p>
                  <p className="font-display font-bold text-white text-xl">{team.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-xs font-mono mb-1">Use Case</p>
                  <p className="font-display font-bold text-3xl" style={{ color:rgba('gold',1) }}>#{team.use_case_num}</p>
                </div>
              </div>
              {team.strikes>0&&(
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/10">
                  <span className="text-white/30 text-xs mr-1">Strikes:</span>
                  {[0,1,2].map(i=><span key={i} className={i<team.strikes?'strike-pip':'strike-pip-empty'} />)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="teal-divider mb-8" />
        <div className="text-center">
          <p className="text-white/40 text-sm mb-4">When building phase concludes, initiate the presentation order draw.</p>
          <button onClick={handleEvaluation} className="px-10 py-4 rounded-xl font-display font-bold text-xl uppercase tracking-widest transition-all duration-300"
            style={{ background:`linear-gradient(135deg,${rgba('purple',0.25)},${rgba('purple',0.1)})`, border:`1px solid ${rgba('purple',0.6)}`, color:rgba('purple',1), boxShadow:`0 0 30px ${rgba('purple',0.2)}` }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 40px ${rgba('purple',0.4)}`}
            onMouseLeave={e=>e.currentTarget.style.boxShadow=`0 0 30px ${rgba('purple',0.2)}`}>
            🎯 Begin Evaluation Mode
          </button>
        </div>
      </div>
    </Layout>
  );
}
