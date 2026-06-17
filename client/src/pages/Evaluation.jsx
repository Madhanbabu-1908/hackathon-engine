import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAudio } from '../hooks/useAudio.js';
import { rgba, theme } from '../theme.js';
import axios from 'axios';

const SLICE_COLORS = [
  { fill:`rgba(${theme.purple},0.25)`, stroke:`rgba(${theme.purple},1)` },
  { fill:`rgba(${theme.teal},0.25)`,   stroke:`rgba(${theme.teal},1)` },
  { fill:`rgba(${theme.gold},0.25)`,   stroke:`rgba(${theme.gold},1)` },
  { fill:`rgba(${theme.green},0.25)`,  stroke:`rgba(${theme.green},1)` },
  { fill:`rgba(${theme.red},0.25)`,    stroke:`rgba(${theme.red},1)` },
  { fill:`rgba(${theme.teal},0.15)`,   stroke:`rgba(${theme.teal},0.7)` },
];

const TOTAL_SECS     = 15 * 60;
const QNA_START_SECS = 6  * 60;
const ALERT_TIMES    = [7*60, 6*60, 1*60, 0];

function shuffle(arr) {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function fmt(s) {
  const m=Math.floor(s/60),sec=s%60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.rate=0.9;u.pitch=1;u.volume=1;
  window.speechSynthesis.speak(u);
}
function playAlarm(durationSecs=5) {
  try {
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const beepCount=durationSecs*2;
    for(let i=0;i<beepCount;i++){
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type='square';osc.frequency.setValueAtTime(880,ctx.currentTime);
      const t=ctx.currentTime+i*0.5;
      gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(0.4,t+0.05);
      gain.gain.setValueAtTime(0.4,t+0.2);gain.gain.linearRampToValueAtTime(0,t+0.25);
      osc.start(t);osc.stop(t+0.3);
    }
  } catch(e){}
}

export default function Evaluation() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { playWheelTick, playReveal } = useAudio();

  const canvasRef    = useRef(null);
  const spinRef      = useRef({ angle:0, velocity:0, spinning:false });
  const animIdRef    = useRef(null);
  const lastSliceRef = useRef(-1);
  const timerRef     = useRef(null);
  const alertsFired  = useRef(new Set());

  const [remaining,   setRemaining]   = useState([]);
  const [shuffled,    setShuffled]    = useState([]);
  const [order,       setOrder]       = useState([]);
  const [spinning,    setSpinning]    = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [allDone,     setAllDone]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [timerSecs,   setTimerSecs]   = useState(TOTAL_SECS);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDone,   setTimerDone]   = useState(false);
  const [isPaused,    setIsPaused]    = useState(false);
  const [alertMsg,    setAlertMsg]    = useState('');

  useEffect(() => {
    axios.get(`/api/sessions/${sessionId}`).then(r => {
      setRemaining(r.data.teams);setShuffled(shuffle(r.data.teams));
    });
  }, [sessionId]);

  useEffect(() => {
    if (!timerActive||isPaused) return;
    timerRef.current = setInterval(() => {
      setTimerSecs(prev => {
        const next=prev-1;
        ALERT_TIMES.forEach(at => {
          if (next===at&&!alertsFired.current.has(at)) {
            alertsFired.current.add(at);triggerAlert(at);
          }
        });
        if (next<=0) { clearInterval(timerRef.current);setTimerActive(false);setTimerDone(true);return 0; }
        return next;
      });
    },1000);
    return () => clearInterval(timerRef.current);
  }, [timerActive,isPaused]);

  const triggerAlert = (s) => {
    if (s===7*60) {
      playAlarm(5);setTimeout(()=>speak('1 minute left for presentation.'),500);
      setAlertMsg('⚠️ 1 minute left for presentation');setTimeout(()=>setAlertMsg(''),6000);
    } else if (s===6*60) {
      playAlarm(5);setTimeout(()=>speak('Presentation time is over. Jury Q and A starts now.'),500);
      setAlertMsg('🎤 Presentation over — Jury Q&A starts now!');setTimeout(()=>setAlertMsg(''),6000);
    } else if (s===1*60) {
      playAlarm(5);setTimeout(()=>speak('1 minute left for Q and A.'),500);
      setAlertMsg('⚠️ 1 minute left for Q&A');setTimeout(()=>setAlertMsg(''),6000);
    } else if (s===0) {
      playAlarm(10);setTimeout(()=>speak('Evaluation time is complete.'),800);
      setAlertMsg('✅ Evaluation time complete!');
    }
  };

  const resetTimer = () => {
    alertsFired.current=new Set();
    setTimerSecs(TOTAL_SECS);setTimerDone(false);
    setIsPaused(false);setTimerActive(false);setAlertMsg('');
  };

  const startTimer = () => {
    alertsFired.current=new Set();
    setTimerSecs(TOTAL_SECS);setTimerDone(false);
    setIsPaused(false);setTimerActive(true);setAlertMsg('');
  };

  const handlePause = () => setIsPaused(p=>!p);

  const handleFastForward = () => {
    setTimerSecs(prev => {
      const next=Math.max(0,prev-10);
      ALERT_TIMES.forEach(at => {
        if (next<=at&&prev>at&&!alertsFired.current.has(at)) {
          alertsFired.current.add(at);triggerAlert(at);
        }
      });
      if (next<=0) { clearInterval(timerRef.current);setTimerActive(false);setTimerDone(true); }
      return next;
    });
  };

  const handleSkip = () => {
    if (!window.confirm(`Skip evaluation timer for ${selected?.name}?`)) return;
    clearInterval(timerRef.current);
    resetTimer();
    const newOrder=[ ...order,selected];
    const newRemaining=remaining.filter(t=>t.id!==selected.id);
    setOrder(newOrder);setRemaining(newRemaining);setShuffled(shuffle(newRemaining));setSelected(null);
    if (newRemaining.length===0) setAllDone(true);
  };

  const handleNext = () => {
    const newOrder=[...order,selected];
    const newRemaining=remaining.filter(t=>t.id!==selected.id);
    setOrder(newOrder);setRemaining(newRemaining);setShuffled(shuffle(newRemaining));setSelected(null);
    resetTimer();
    if (newRemaining.length===0) setAllDone(true);
  };

  const drawWheel = useCallback(() => {
    const canvas=canvasRef.current;
    if (!canvas||shuffled.length===0) return;
    const ctx=canvas.getContext('2d'),cx=canvas.width/2,cy=canvas.height/2,r=Math.min(cx,cy)-20;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const sa=(2*Math.PI)/shuffled.length;
    shuffled.forEach((team,i) => {
      const start=spinRef.current.angle+i*sa,end=start+sa,c=SLICE_COLORS[i%SLICE_COLORS.length];
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();
      ctx.fillStyle=c.fill;ctx.fill();ctx.strokeStyle=c.stroke;ctx.lineWidth=2;ctx.stroke();
      ctx.save();ctx.translate(cx,cy);ctx.rotate(start+sa/2);ctx.textAlign='right';
      ctx.fillStyle=c.stroke;ctx.font=`bold ${Math.min(16,120/shuffled.length)}px 'Rajdhani',sans-serif`;
      ctx.shadowColor=c.stroke;ctx.shadowBlur=8;ctx.fillText(team.name,r-16,5);ctx.restore();
    });
    const hg=ctx.createRadialGradient(cx,cy,0,cx,cy,30);
    hg.addColorStop(0,rgba('purple',0.6));hg.addColorStop(1,rgba('purple',0.1));
    ctx.beginPath();ctx.arc(cx,cy,28,0,Math.PI*2);ctx.fillStyle=hg;ctx.fill();
    ctx.strokeStyle=rgba('purple',1);ctx.lineWidth=2;ctx.stroke();
    const px=cx,py=cy-r-2;
    ctx.beginPath();ctx.moveTo(px-12,py-18);ctx.lineTo(px+12,py-18);ctx.lineTo(px,py+2);ctx.closePath();
    ctx.fillStyle=rgba('gold',1);ctx.shadowColor=rgba('gold',1);ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
  },[shuffled]);

  useEffect(()=>{drawWheel();},[drawWheel]);

  const getTopSlice=useCallback(()=>{
    if (shuffled.length===0) return -1;
    const sa=(2*Math.PI)/shuffled.length;
    const n=(((-spinRef.current.angle-Math.PI/2)%(2*Math.PI))+(2*Math.PI))%(2*Math.PI);
    return Math.floor(n/sa)%shuffled.length;
  },[shuffled.length]);

  const animateSpin=useCallback(()=>{
    if (!spinRef.current.spinning) return;
    spinRef.current.angle+=spinRef.current.velocity;spinRef.current.velocity*=0.985;
    const cur=getTopSlice();
    if (cur!==lastSliceRef.current){lastSliceRef.current=cur;playWheelTick();}
    drawWheel();
    if (spinRef.current.velocity<0.003){
      spinRef.current.spinning=false;setSpinning(false);
      const w=shuffled[getTopSlice()];if(w){setSelected(w);playReveal();}return;
    }
    animIdRef.current=requestAnimationFrame(animateSpin);
  },[drawWheel,getTopSlice,playWheelTick,playReveal,shuffled]);

  const handleSpin=()=>{
    if (spinning||shuffled.length===0||selected||timerActive) return;
    setSelected(null);setShuffled(shuffle(remaining));
    spinRef.current.velocity=0.25+Math.random()*0.2;
    spinRef.current.spinning=true;setSpinning(true);
    animIdRef.current=requestAnimationFrame(animateSpin);
  };

  useEffect(()=>{if(spinning)animateSpin();},[animateSpin,spinning]);
  useEffect(()=>()=>{if(animIdRef.current)cancelAnimationFrame(animIdRef.current);clearInterval(timerRef.current);},[]);

  const isQnA    = timerSecs<=QNA_START_SECS;
  const isUrgent = timerSecs<=60&&timerSecs>0;
  const timerColor = timerDone?rgba('green',1):isUrgent?rgba('red',1):isQnA?rgba('purple',1):rgba('teal',1);

  const handleFinalize=async()=>{
    setSaving(true);
    try {
      await axios.patch(`/api/sessions/${sessionId}/presentation-order`,{order:order.map(t=>t.id)});
      await axios.patch(`/api/sessions/${sessionId}/phase`,{phase:'COMPLETE'});
      navigate('/archives');
    } catch(err){console.error(err);setSaving(false);}
  };

  return (
    <Layout>
      <button onClick={()=>navigate('/')} className="text-white/30 text-sm hover:text-white/60 transition-colors mb-4 block">← Back</button>
      <div className="flex gap-6 items-start">

        <div className="flex-1 flex flex-col items-center">
          <div className="text-center mb-4">
            <h2 className="font-display font-bold text-white text-2xl">
              Presentation <span style={{color:rgba('purple',1)}}>Order Draw</span>
            </h2>
            <p className="text-white/40 text-sm mt-1">Spin → Confirm → Present → Next</p>
          </div>

          {!allDone ? (
            <>
              {!timerActive&&!timerDone&&(
                <canvas ref={canvasRef} width={380} height={380} className="rounded-full"
                  style={{filter:`drop-shadow(0 0 20px ${rgba('purple',0.2)})`}} />
              )}

              {(timerActive||timerDone)&&selected&&(
                <div className="w-full flex flex-col items-center">
                  <div className="text-center mb-4">
                    <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-1">Now Presenting</p>
                    <p className="font-display font-bold text-3xl" style={{color:rgba('gold',1)}}>{selected.name}</p>
                  </div>

                  <div className="mb-3 px-4 py-1 rounded-full text-xs font-mono uppercase tracking-widest"
                    style={{background:isQnA||timerDone?rgba('purple',0.2):rgba('teal',0.2),
                      border:`1px solid ${isQnA||timerDone?rgba('purple',0.5):rgba('teal',0.5)}`,
                      color:isQnA||timerDone?rgba('purple',1):rgba('teal',1)}}>
                    {timerDone?'✅ Complete':isPaused?'⏸ Paused':isQnA?'🎤 Jury Q&A':'📊 Team Presentation'}
                  </div>

                  <div className="glass-card rounded-2xl px-16 py-8 text-center mb-4"
                    style={{border:`1px solid ${timerColor}`}}>
                    <p className="font-display font-bold tabular-nums"
                      style={{fontSize:'5rem',lineHeight:1,color:timerColor,
                        textShadow:`0 0 30px ${timerColor}, 0 0 60px ${timerColor}`,
                        animation:isUrgent&&!isPaused?'countUrgent 0.5s ease-in-out infinite alternate':'none'}}>
                      {fmt(timerSecs)}
                    </p>
                    <div className="mt-4 w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{width:`${(timerSecs/TOTAL_SECS)*100}%`,
                          background:isUrgent?rgba('red',1):isQnA?rgba('purple',1):rgba('teal',1)}}/>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-white/30 font-mono">
                      <span>Presentation: 9:00</span><span>Q&A: 6:00</span>
                    </div>
                  </div>

                  {alertMsg&&(
                    <div className="w-full text-center py-3 px-4 rounded-xl mb-3 font-display font-semibold text-lg"
                      style={{background:rgba('gold',0.15),border:`1px solid ${rgba('gold',0.5)}`,
                        color:rgba('gold',1),boxShadow:`0 0 20px ${rgba('gold',0.3)}`}}>
                      {alertMsg}
                    </div>
                  )}

                  {timerActive&&!timerDone&&(
                    <div className="flex items-center gap-3 w-full max-w-sm mt-1 mb-3">
                      <button onClick={handlePause}
                        className="flex-1 py-2 rounded-lg font-display font-semibold text-sm uppercase tracking-wider transition-all duration-200"
                        style={{background:isPaused?rgba('gold',0.2):rgba('teal',0.1),
                          border:`1px solid ${isPaused?rgba('gold',0.5):rgba('teal',0.3)}`,
                          color:isPaused?rgba('gold',1):rgba('teal',1)}}>
                        {isPaused?'▶ Resume':'⏸ Pause'}
                      </button>
                      <button onClick={handleFastForward}
                        className="flex-1 py-2 rounded-lg font-display font-semibold text-sm uppercase tracking-wider transition-all duration-200"
                        style={{background:rgba('purple',0.1),border:`1px solid ${rgba('purple',0.3)}`,color:rgba('purple',1)}}>
                        ⏩ +10s
                      </button>
                      <button onClick={handleSkip}
                        className="flex-1 py-2 rounded-lg font-display font-semibold text-sm uppercase tracking-wider transition-all duration-200"
                        style={{background:rgba('red',0.1),border:`1px solid ${rgba('red',0.3)}`,color:rgba('red',1)}}>
                        ⏭ Skip
                      </button>
                    </div>
                  )}

                  {timerDone&&(
                    <button onClick={handleNext}
                      className="mt-2 px-10 py-4 rounded-xl font-display font-bold text-xl uppercase tracking-widest transition-all duration-300"
                      style={{background:`linear-gradient(135deg,${rgba('green',0.25)},${rgba('green',0.1)})`,
                        border:`1px solid ${rgba('green',0.6)}`,color:rgba('green',1),
                        boxShadow:`0 0 30px ${rgba('green',0.3)}`}}>
                      {remaining.length>1?'⟳ Next Team':'✓ Finalize Order'}
                    </button>
                  )}
                </div>
              )}

              {!timerActive&&!timerDone&&(
                <div className="mt-5 flex flex-col items-center gap-3 w-full max-w-xs">
                  {!selected?(
                    <button onClick={handleSpin} disabled={spinning||shuffled.length===0}
                      className="w-full py-4 rounded-xl font-display font-bold text-xl uppercase tracking-widest transition-all duration-300 disabled:opacity-40"
                      style={{background:`linear-gradient(135deg,${rgba('purple',0.2)},${rgba('purple',0.05)})`,
                        border:`1px solid ${rgba('purple',0.6)}`,color:rgba('purple',1),
                        boxShadow:spinning?'none':`0 0 25px ${rgba('purple',0.25)}`}}>
                      {spinning?'◎ Spinning...':'⟳ Spin the Wheel'}
                    </button>
                  ):(
                    <div className="w-full space-y-3">
                      <div className="text-center py-3 rounded-xl border-gold-neon" style={{background:rgba('gold',0.1)}}>
                        <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-1">Presents #{order.length+1}</p>
                        <p className="font-display font-bold text-2xl" style={{color:rgba('gold',1)}}>{selected.name}</p>
                      </div>
                      <button onClick={startTimer}
                        className="w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-widest transition-all duration-300"
                        style={{background:`linear-gradient(135deg,${rgba('teal',0.25)},${rgba('teal',0.1)})`,
                          border:`1px solid ${rgba('teal',0.6)}`,color:rgba('teal',1),
                          boxShadow:`0 0 25px ${rgba('teal',0.3)}`}}>
                        ✓ Confirm — Start Timer
                      </button>
                      <button onClick={()=>{setSelected(null);setShuffled(shuffle(remaining));}}
                        className="w-full py-2 text-white/30 text-sm hover:text-white/60 transition-colors">
                        ← Re-spin
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ):(
            <div className="text-center mt-8 space-y-6">
              <div className="text-6xl animate-float">🏆</div>
              <h3 className="font-display font-bold text-3xl" style={{color:rgba('purple',1)}}>Presentation Order Set!</h3>
              <button onClick={handleFinalize} disabled={saving}
                className="px-12 py-5 rounded-xl font-display font-bold text-2xl uppercase tracking-widest disabled:opacity-50"
                style={{background:`linear-gradient(135deg,${rgba('teal',0.3)},${rgba('teal',0.1)})`,
                  border:`2px solid ${rgba('teal',0.8)}`,color:rgba('teal',1),
                  boxShadow:`0 0 40px ${rgba('teal',0.4)}`}}>
                {saving?'Saving...':'✓ Finalize & Archive'}
              </button>
            </div>
          )}
        </div>

        <div className="w-64 shrink-0 pt-14">
          <div className="glass-card rounded-xl p-4 border-teal-neon">
            <h4 className="text-xs font-mono uppercase tracking-widest mb-3" style={{color:rgba('teal',1)}}>Presentation Order</h4>
            {order.length===0
              ?<p className="text-white/20 text-sm text-center py-4">Not yet determined</p>
              :<div className="space-y-2">
                {order.map((team,i)=>(
                  <div key={team.id} className="flex items-center gap-3 py-2 border-b border-white/5">
                    <span className="font-display font-bold text-xl w-6" style={{color:rgba('gold',1)}}>{i+1}</span>
                    <span className="text-white font-body text-sm">{team.name}</span>
                    <span className="ml-auto text-white/20 text-xs">✓</span>
                  </div>
                ))}
              </div>
            }
            {remaining.length>0&&!allDone&&(
              <>
                <div className="teal-divider my-3"/>
                <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-2">Remaining</p>
                {remaining.map(t=><p key={t.id} className="text-white/40 text-sm py-1">{t.name}</p>)}
              </>
            )}
          </div>

          {(timerActive||timerDone)&&(
            <div className="mt-4 glass-card rounded-xl p-4">
              <h4 className="text-xs font-mono uppercase tracking-widest mb-3" style={{color:rgba('teal',1)}}>Time Split</h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span style={{color:rgba('teal',0.8)}}>● Presentation</span><span className="text-white/50">9:00</span></div>
                <div className="flex justify-between"><span style={{color:rgba('purple',0.8)}}>● Jury Q&A</span><span className="text-white/50">6:00</span></div>
                <div className="teal-divider my-1"/>
                <div className="flex justify-between text-white/40"><span>Total</span><span>15:00</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
