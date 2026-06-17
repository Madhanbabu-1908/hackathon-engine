import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StrikeBoard from '../components/StrikeBoard.jsx';
import { useAudio } from '../hooks/useAudio.js';
import { rgba, theme } from '../theme.js';
import axios from 'axios';

const SLICE_COLORS = [
  { fill: `rgba(${[...Array(1)].map(()=>theme.teal)},0.25)`,   stroke: `rgba(${theme.teal},1)` },
  { fill: `rgba(${[...Array(1)].map(()=>theme.gold)},0.25)`,   stroke: `rgba(${theme.gold},1)` },
  { fill: `rgba(${[...Array(1)].map(()=>theme.purple)},0.25)`, stroke: `rgba(${theme.purple},1)` },
  { fill: `rgba(${theme.green},0.25)`,  stroke: `rgba(${theme.green},1)` },
  { fill: `rgba(${theme.red},0.25)`,    stroke: `rgba(${theme.red},1)` },
  { fill: `rgba(${theme.teal},0.15)`,   stroke: `rgba(${theme.teal},0.7)` },
];

function shuffle(arr) {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

export default function SpinWheel() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { playWheelTick } = useAudio();

  const canvasRef    = useRef(null);
  const spinRef      = useRef({ angle:0, velocity:0, spinning:false });
  const animIdRef    = useRef(null);
  const lastSliceRef = useRef(-1);

  const [shuffledQueue, setShuffledQueue] = useState([]);
  const [queue,         setQueue]         = useState([]);
  const [waitingTeams,  setWaitingTeams]  = useState([]);
  const [allTeams,      setAllTeams]      = useState([]);
  const [session,       setSession]       = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [spinning,      setSpinning]      = useState(false);
  const [allDone,       setAllDone]       = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const [qRes, sRes] = await Promise.all([
        axios.get(`/api/draft/queue/${sessionId}`),
        axios.get(`/api/sessions/${sessionId}`),
      ]);
      const q=qRes.data.queue, wt=qRes.data.waiting||[];
      setQueue(q); setWaitingTeams(wt); setAllTeams(qRes.data.all_teams); setSession(sRes.data.session);
      setShuffledQueue(shuffle(q));
      if(q.length===0&&wt.length===0) setAllDone(true);
    } catch(err){console.error(err);}
  }, [sessionId]);

  useEffect(()=>{loadQueue();},[loadQueue]);

  const drawWheel = useCallback(()=>{
    const canvas=canvasRef.current;
    if(!canvas||shuffledQueue.length===0) return;
    const ctx=canvas.getContext('2d'), cx=canvas.width/2, cy=canvas.height/2, r=Math.min(cx,cy)-20;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const sa=(2*Math.PI)/shuffledQueue.length;
    shuffledQueue.forEach((team,i)=>{
      const start=spinRef.current.angle+i*sa, end=start+sa;
      const color=SLICE_COLORS[i%SLICE_COLORS.length];
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();
      ctx.fillStyle=color.fill;ctx.fill();ctx.strokeStyle=color.stroke;ctx.lineWidth=2;ctx.stroke();
      ctx.save();ctx.translate(cx,cy);ctx.rotate(start+sa/2);ctx.textAlign='right';
      ctx.fillStyle=color.stroke;ctx.font=`bold ${Math.min(16,120/shuffledQueue.length)}px 'Rajdhani',sans-serif`;
      ctx.shadowColor=color.stroke;ctx.shadowBlur=8;ctx.fillText(team.name,r-16,5);
      if(team.strikes>0){ctx.font='10px sans-serif';ctx.fillStyle=rgba('red',1);ctx.shadowColor=rgba('red',1);ctx.fillText('●'.repeat(team.strikes),r-16,18);}
      ctx.restore();
    });
    const hg=ctx.createRadialGradient(cx,cy,0,cx,cy,30);
    hg.addColorStop(0,rgba('teal',0.6));hg.addColorStop(1,rgba('teal',0.1));
    ctx.beginPath();ctx.arc(cx,cy,28,0,Math.PI*2);ctx.fillStyle=hg;ctx.fill();
    ctx.strokeStyle=rgba('teal',1);ctx.lineWidth=2;ctx.stroke();
    const px=cx,py=cy-r-2;
    ctx.beginPath();ctx.moveTo(px-12,py-18);ctx.lineTo(px+12,py-18);ctx.lineTo(px,py+2);ctx.closePath();
    ctx.fillStyle=rgba('gold',1);ctx.shadowColor=rgba('gold',1);ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
  },[shuffledQueue]);

  useEffect(()=>{drawWheel();},[drawWheel]);

  const getTopSlice=useCallback(()=>{
    if(shuffledQueue.length===0) return -1;
    const sa=(2*Math.PI)/shuffledQueue.length;
    const n=(((-spinRef.current.angle-Math.PI/2)%(2*Math.PI))+(2*Math.PI))%(2*Math.PI);
    return Math.floor(n/sa)%shuffledQueue.length;
  },[shuffledQueue.length]);

  const animateSpin=useCallback(()=>{
    if(!spinRef.current.spinning) return;
    spinRef.current.angle+=spinRef.current.velocity;spinRef.current.velocity*=0.985;
    const cur=getTopSlice();
    if(cur!==lastSliceRef.current){lastSliceRef.current=cur;playWheelTick();}
    drawWheel();
    if(spinRef.current.velocity<0.003){
      spinRef.current.spinning=false;setSpinning(false);
      const w=shuffledQueue[getTopSlice()];if(w)setSelected(w);return;
    }
    animIdRef.current=requestAnimationFrame(animateSpin);
  },[drawWheel,getTopSlice,playWheelTick,shuffledQueue]);

  const handleSpin=()=>{
    if(spinning||shuffledQueue.length===0||selected) return;
    setSelected(null);setShuffledQueue(shuffle(queue));
    spinRef.current.velocity=0.25+Math.random()*0.2;spinRef.current.spinning=true;setSpinning(true);
    animIdRef.current=requestAnimationFrame(animateSpin);
  };

  useEffect(()=>()=>{if(animIdRef.current)cancelAnimationFrame(animIdRef.current);},[]);
  useEffect(()=>{if(spinning)animateSpin();},[animateSpin,spinning]);

  return (
    <Layout>
      <button onClick={()=>navigate('/')} className="text-white/30 text-sm hover:text-white/60 transition-colors mb-4 block">← Back</button>
      <div className="flex gap-6 items-start">
        <div className="flex-1 flex flex-col items-center">
          <div className="mb-4 text-center">
            <h2 className="font-display font-bold text-white text-2xl">Use Case <span style={{color:rgba('teal',1)}}>Draft</span></h2>
            <p className="text-white/40 text-sm mt-1">{session?.label} · {session?.date_label}</p>
          </div>
          {!allDone ? (
            <>
              {shuffledQueue.length>0
                ? <canvas ref={canvasRef} width={420} height={420} className="rounded-full" style={{filter:`drop-shadow(0 0 20px ${rgba('teal',0.2)})`}} />
                : <div className="w-96 h-96 flex flex-col items-center justify-center glass-card rounded-full border-teal-neon">
                    <p className="text-4xl mb-3">⏳</p>
                    <p className="font-display font-bold text-xl" style={{color:rgba('teal',1)}}>Round Complete</p>
                    <p className="text-white/40 text-sm mt-2 text-center px-8">Waiting teams re-enter next round</p>
                  </div>
              }
              {waitingTeams.length>0&&(
                <div className="mt-3 px-4 py-2 rounded-lg text-center" style={{background:rgba('red',0.08),border:`1px solid ${rgba('red',0.25)}`}}>
                  <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-1">Sitting Out This Round</p>
                  <p className="text-sm font-display" style={{color:rgba('red',1)}}>{waitingTeams.map(t=>t.name).join(' · ')}</p>
                </div>
              )}
              <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-xs">
                {!selected ? (
                  <button onClick={handleSpin} disabled={spinning||shuffledQueue.length===0}
                    className="w-full py-4 rounded-xl font-display font-bold text-xl uppercase tracking-widest transition-all duration-300 disabled:opacity-40"
                    style={{background:`linear-gradient(135deg,${rgba('teal',0.2)},${rgba('teal',0.05)})`,border:`1px solid ${rgba('teal',0.6)}`,color:rgba('teal',1),boxShadow:spinning?'none':`0 0 25px ${rgba('teal',0.25)}`}}>
                    {spinning?'◎ Spinning...':shuffledQueue.length===0?'⏳ Waiting...':'⟳ Spin the Wheel'}
                  </button>
                ) : (
                  <div className="w-full space-y-3">
                    <div className="text-center py-3 rounded-xl border-gold-neon" style={{background:rgba('gold',0.1)}}>
                      <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-1">Selected</p>
                      <p className="font-display font-bold text-2xl" style={{color:rgba('gold',1)}}>{selected.name}</p>
                    </div>
                    <button onClick={()=>navigate(`/session/${sessionId}/challenge`,{state:{team:selected,session}})}
                      className="w-full py-4 rounded-xl font-display font-bold text-xl uppercase tracking-widest transition-all duration-300"
                      style={{background:`linear-gradient(135deg,${rgba('gold',0.25)},${rgba('gold',0.1)})`,border:`1px solid ${rgba('gold',0.7)}`,color:rgba('gold',1),boxShadow:`0 0 30px ${rgba('gold',0.3)}`}}>
                      ⚡ Initiate Challenge
                    </button>
                    <button onClick={()=>{setSelected(null);setShuffledQueue(shuffle(queue));}} className="w-full py-2 text-white/30 text-sm hover:text-white/60 transition-colors">← Re-spin</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center mt-8 space-y-6">
              <div className="text-6xl animate-float">🚀</div>
              <h3 className="font-display font-bold text-3xl" style={{color:rgba('teal',1)}}>All Teams Assigned!</h3>
              <p className="text-white/50">Every team has their use case. Time to build.</p>
              <button onClick={async()=>{await axios.patch(`/api/sessions/${sessionId}/phase`,{phase:'ACTIVE'});navigate(`/session/${sessionId}/active`);}}
                className="px-12 py-5 rounded-xl font-display font-bold text-2xl uppercase tracking-widest transition-all duration-300"
                style={{background:`linear-gradient(135deg,${rgba('teal',0.3)},${rgba('teal',0.1)})`,border:`2px solid ${rgba('teal',0.8)}`,color:rgba('teal',1),boxShadow:`0 0 40px ${rgba('teal',0.4)}`}}>
                🚀 Launch Hackathon
              </button>
            </div>
          )}
        </div>
        <div className="w-64 shrink-0 pt-16"><StrikeBoard teams={allTeams} /></div>
      </div>
    </Layout>
  );
}
