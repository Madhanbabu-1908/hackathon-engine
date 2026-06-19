import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAudio } from '../hooks/useAudio.js';
import { rgba } from '../theme.js';
import axios from 'axios';

const TIMER_DURATION = 45;

export default function Challenge() {
  const { id: sessionId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { playCountdownTick, playSuccess, playFailure, playReveal } = useAudio();

  const team    = location.state?.team;
  const session = location.state?.session;

  const [phase,    setPhase]    = useState('READY');
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [selected, setSelected] = useState(null);
  const [outcome,  setOutcome]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const timerRef   = useRef(null);
  const questionId = useRef(null);

  useEffect(() => {
    axios.get(`/api/questions/next/${sessionId}`).then(r => { setQuestion(r.data); questionId.current = r.data.id; });
  }, [sessionId]);

  const startTimer = () => {
    setPhase('ACTIVE'); setTimeLeft(TIMER_DURATION);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 10 && next > 0) playCountdownTick();
        if (next <= 0) { clearInterval(timerRef.current); handleResolve(-1); return 0; }
        return next;
      });
    }, 1000);
  };

  const handleAnswer = (idx) => {
    if (phase !== 'ACTIVE' || selected !== null) return;
    clearInterval(timerRef.current); setSelected(idx); handleResolve(idx);
  };

  const handleResolve = async (selectedIdx) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/draft/resolve', { session_id:sessionId, team_id:team.id, question_id:questionId.current, selected_idx:selectedIdx });
      setOutcome(res.data); setPhase('REVEALED');
      if (res.data.outcome==='CORRECT') { playSuccess(); setTimeout(()=>playReveal(),600); }
      else if (res.data.outcome==='PITY_PASS') { playReveal(); }
      else { playFailure(); }
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  const speakQuestion = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // Look specifically for Indian English accent
    const indianVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en-IN'));
    if (indianVoice) {
      utterance.voice = indianVoice;
    }
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = setVoice;
  } else {
    setVoice();
  }
};

  useEffect(() => () => clearInterval(timerRef.current), []);
  useEffect(() => {
  if (question) {
    speakQuestion(question.question);
  }
}, [question]);

  const timerColor = timeLeft<=10 ? rgba('red',1) : timeLeft<=30 ? rgba('gold',1) : rgba('teal',1);
  const timerUrgent = timeLeft<=10 && phase==='ACTIVE';

  if (!team) return <Layout><div className="text-center py-20 text-white/40">No team selected. <button onClick={()=>navigate(-1)} className="underline" style={{ color:rgba('teal',1) }}>Go back</button></div></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-4">
        <button onClick={() => navigate(-1)} className="text-white/30 text-sm hover:text-white/60 transition-colors mb-4 block">← Back</button>

        <div className="text-center mb-6">
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-1">Challenge Round</p>
          <h2 className="font-display font-bold text-4xl" style={{ color:rgba('teal',1) }}>{team.name}</h2>
          {team.strikes > 0 && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-white/30 text-xs mr-1">Strikes:</span>
              {[0,1,2].map(i=><span key={i} className={i<team.strikes?'strike-pip':'strike-pip-empty'} />)}
            </div>
          )}
        </div>

        {phase==='READY' && (
          <div className="glass-card rounded-2xl p-10 text-center border-gold-neon">
            <div className="text-6xl mb-6 animate-float">⚡</div>
            <p className="text-white/60 font-body mb-8 text-lg">Team is at the terminal. Ready to begin?</p>
            <button onClick={startTimer} disabled={!question} className="px-12 py-5 rounded-xl font-display font-bold text-2xl uppercase tracking-widest transition-all duration-300 disabled:opacity-40"
              style={{ background:`linear-gradient(135deg,${rgba('gold',0.25)},${rgba('gold',0.1)})`, border:`2px solid ${rgba('gold',0.7)}`, color:rgba('gold',1), boxShadow:`0 0 40px ${rgba('gold',0.3)}` }}>
              ⚡ Initiate Challenge
            </button>
          </div>
        )}

        {(phase==='ACTIVE'||phase==='REVEALED') && question && (
          <div className="space-y-4">
            <div className="flex items-center justify-between glass-card rounded-xl px-5 py-3">
              <span className="text-white/40 text-sm font-mono uppercase tracking-widest">Time Remaining</span>
              <span className={`font-display font-bold text-4xl tabular-nums ${timerUrgent?'timer-urgent':''}`} style={{ color:timerColor }}>
                {String(timeLeft).padStart(2,'0')}s
              </span>
            </div>

            <div className="glass-card rounded-2xl p-6 border-teal-neon">
              <p className="text-white/50 text-xs font-mono uppercase tracking-widest mb-3">Question</p>
              <p className="text-white font-body text-lg leading-relaxed">{question.question}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {question.options.map((opt,idx) => {
                let style = {};
                if (phase==='REVEALED') {
                  if (idx===question.correct_idx) style = { background:rgba('green',0.2), border:`2px solid ${rgba('green',0.8)}`, color:rgba('green',1), boxShadow:`0 0 20px ${rgba('green',0.3)}` };
                  else if (idx===selected && idx!==question.correct_idx) style = { background:rgba('red',0.2), border:`2px solid ${rgba('red',0.6)}`, color:rgba('red',1) };
                  else style = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.3)' };
                } else {
                  style = { background:selected===idx?rgba('teal',0.15):'rgba(255,255,255,0.05)', border:`1px solid ${selected===idx?rgba('teal',0.6):'rgba(255,255,255,0.1)'}`, color:selected===idx?rgba('teal',1):'white', cursor:'pointer' };
                }
                return (
                  <button key={idx} onClick={()=>handleAnswer(idx)} disabled={phase==='REVEALED'||selected!==null||loading}
                    className="w-full text-left px-5 py-4 rounded-xl font-body text-base transition-all duration-200" style={style}>
                    <span className="font-mono text-sm opacity-60 mr-3">{['A','B','C','D'][idx]}.</span>
                    {opt}
                    {phase==='REVEALED'&&idx===question.correct_idx&&<span className="float-right text-lg" style={{ color:rgba('green',1) }}>✓</span>}
                    {phase==='REVEALED'&&idx===selected&&idx!==question.correct_idx&&<span className="float-right text-lg" style={{ color:rgba('red',1) }}>✗</span>}
                  </button>
                );
              })}
            </div>

            {phase==='REVEALED'&&outcome&&(
              <div className="rounded-2xl p-6 text-center mt-2"
                style={{ background: outcome.outcome==='CORRECT'||outcome.outcome==='PITY_PASS' ? rgba('green',0.1) : rgba('red',0.1), border:`1px solid ${outcome.outcome==='CORRECT'||outcome.outcome==='PITY_PASS'?rgba('green',0.4):rgba('red',0.4)}` }}>
                <p className="text-4xl mb-2">{outcome.outcome==='CORRECT'?'🎯':outcome.outcome==='PITY_PASS'?'🎁':outcome.outcome==='TIMEOUT'?'⏰':'✗'}</p>
                <p className="font-display font-bold text-2xl mb-1"
                  style={{ color: outcome.outcome==='CORRECT'||outcome.outcome==='PITY_PASS'?rgba('green',1):rgba('red',1) }}>
                  {outcome.outcome==='CORRECT'?'Correct!':outcome.outcome==='PITY_PASS'?'Pity Pass — 3 Strikes':outcome.outcome==='TIMEOUT'?"Time's Up!":'Wrong Answer'}
                </p>
                {outcome.use_case_num&&(
                  <div className="mt-4 py-4 px-6 rounded-xl" style={{ background:rgba('gold',0.1), border:`1px solid ${rgba('gold',0.4)}` }}>
                    <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-1">Use Case Assigned</p>
                    <p className="font-display font-bold text-5xl" style={{ color:rgba('gold',1) }}>#{outcome.use_case_num}</p>
                    <p className="text-white/40 text-xs mt-1">Check the use case sheet for details</p>
                  </div>
                )}
                {!outcome.use_case_num&&<p className="text-white/50 text-sm mt-2">Strike added. Back to queue.</p>}
                <button onClick={()=>navigate(`/session/${sessionId}/draft`)} className="mt-5 px-8 py-3 rounded-xl font-display font-semibold text-base uppercase tracking-widest transition-all duration-200"
                  style={{ background:rgba('teal',0.1), border:`1px solid ${rgba('teal',0.4)}`, color:rgba('teal',1) }}>
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
