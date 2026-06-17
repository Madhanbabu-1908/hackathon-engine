import { rgba } from '../theme.js';

export default function StrikeBoard({ teams }) {
  if (!teams || teams.length === 0) return null;
  return (
    <div className="glass-card rounded-xl p-4 border-teal-neon">
      <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color:rgba('teal',1) }}>
        Strike Board
      </h3>
      <div className="space-y-2">
        {teams.map(team => (
          <div key={team.id} className="flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300"
            style={{ background: team.is_drafted ? rgba('teal',0.1) : 'rgba(255,255,255,0.05)',
              border: `1px solid ${team.is_drafted ? rgba('teal',0.3) : 'rgba(255,255,255,0.1)'}` }}>
            <span className="font-display font-semibold text-sm truncate mr-2"
              style={{ color: team.is_drafted ? rgba('teal',1) : 'rgba(255,255,255,0.8)' }}>
              {team.name}
              {team.waiting ? <span className="ml-2 text-xs font-mono" style={{ color:rgba('red',0.7) }}>⏳</span> : null}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1">
                {[0,1,2].map(i => <span key={i} className={i < team.strikes ? 'strike-pip' : 'strike-pip-empty'} />)}
              </div>
              {team.use_case_num
                ? <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background:rgba('gold',0.2), color:rgba('gold',1), border:`1px solid ${rgba('gold',0.4)}` }}>#{team.use_case_num}</span>
                : <span className="text-white/20 text-xs font-mono">—</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 teal-divider" />
      <div className="mt-2 flex items-center gap-4 text-xs text-white/30">
        <span className="flex items-center gap-1"><span className="strike-pip" style={{ width:8,height:8 }} /> Strike</span>
        <span className="flex items-center gap-1">
          <span className="font-mono px-1 rounded text-xs" style={{ background:rgba('gold',0.2), color:rgba('gold',1), border:`1px solid ${rgba('gold',0.4)}` }}>#N</span> Use Case
        </span>
      </div>
    </div>
  );
}
