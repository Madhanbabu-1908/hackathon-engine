import { useNavigate } from 'react-router-dom';
import ParticleBackground from './ParticleBackground.jsx';
import { rgba } from '../theme.js';
import { clearCredentials, getCredentials } from '../utils/credentials.js';

export default function Layout({ children, showHeader=true }) {
  const navigate = useNavigate();

  const handleLogoff = () => {
    if (!window.confirm('Log off? This will clear your API credentials.')) return;
    clearCredentials();
    navigate('/login', { replace: true });
  };

  const creds = getCredentials();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{backgroundColor:'var(--bg)'}}>
      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none" style={{zIndex:1,
        background:`radial-gradient(ellipse at top,${rgba('teal',0.04)} 0%,transparent 60%),radial-gradient(ellipse at bottom right,${rgba('purple',0.04)} 0%,transparent 60%)`}} />
      <div className="relative" style={{zIndex:2}}>
        {showHeader && (
          <header className="px-6 pt-5 pb-4">
            <div className="teal-divider mb-4" />
            <div className="flex items-center justify-between">
              {/* Left — TCS branding */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center"
                  style={{border:`1px solid ${rgba('teal',0.6)}`}}>
                  <span className="font-mono text-xs font-bold" style={{color:rgba('teal',1)}}>TCS</span>
                </div>
                <div>
                  <h1 className="font-display font-bold text-white text-lg leading-none tracking-wide">
                    GenAI Lab <span style={{color:rgba('teal',1)}}>Coimbatore</span>
                  </h1>
                  <p className="text-white/40 text-xs font-body mt-0.5 tracking-widest uppercase">
                    Enter as a Learner — Exit as an AI Engineer
                  </p>
                </div>
              </div>

              {/* Right — model label + logoff */}
              <div className="flex items-center gap-4">
                {/* Active model badge */}
                {creds?.model && (
                  <span className="text-xs font-mono px-2 py-1 rounded hidden sm:block"
                    style={{background:rgba('teal',0.08),border:`1px solid ${rgba('teal',0.2)}`,color:rgba('teal',0.6)}}>
                    {creds.model}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{backgroundColor:rgba('teal',1)}} />
                  <span className="text-xs font-mono uppercase tracking-widest" style={{color:rgba('teal',0.6)}}>
                    Live
                  </span>
                </div>
                {/* Log Off button */}
                <button
                  onClick={handleLogoff}
                  className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{background:rgba('red',0.08),border:`1px solid ${rgba('red',0.25)}`,color:rgba('red',0.7)}}
                  onMouseEnter={e=>{e.currentTarget.style.background=rgba('red',0.18);e.currentTarget.style.color=rgba('red',1);}}
                  onMouseLeave={e=>{e.currentTarget.style.background=rgba('red',0.08);e.currentTarget.style.color=rgba('red',0.7);}}>
                  ⏏ Log Off
                </button>
              </div>
            </div>
            <div className="teal-divider mt-4" />
          </header>
        )}
        <main className="px-6 pb-6">{children}</main>
        <footer className="px-6 py-3 text-center">
          <div className="teal-divider mb-3" />
          <p className="text-white/20 text-xs font-body tracking-widest uppercase">
            Built by the <span style={{color:rgba('teal',0.5)}}>Co-Creators Team</span> · TCS GenAI Lab Coimbatore
          </p>
        </footer>
      </div>
    </div>
  );
}
