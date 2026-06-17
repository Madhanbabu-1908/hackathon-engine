// ============================================================
// Login.jsx — First screen. Enter Base URL + API Key,
// fetch available models, choose one, then launch engine.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../utils/credentials.js';
import { rgba } from '../theme.js';
import ParticleBackground from '../components/ParticleBackground.jsx';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();

  const [baseUrl,   setBaseUrl]   = useState('https://genailab.tcs.in/');
  const [apiKey,    setApiKey]    = useState('');
  const [models,    setModels]    = useState([]);
  const [model,     setModel]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [fetched,   setFetched]   = useState(false);

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.5rem',
    padding: '0.75rem 1rem', color: 'white', fontFamily: 'inherit',
    fontSize: '0.875rem', outline: 'none',
  };

  // ── Fetch models from TCS MaaS endpoint ─────────────────
  const handleFetchModels = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) {
      setError('Please enter both Base URL and API Key.'); return;
    }
    setError(''); setLoading(true); setFetched(false); setModels([]); setModel('');
    try {
      const res = await axios.post('/api/models/list', {
        base_url: baseUrl.trim(),
        api_key:  apiKey.trim(),
      });
      const list = res.data.models || [];
      if (list.length === 0) { setError('No models returned from endpoint.'); return; }
      setModels(list);
      setModel(list[0].id); // default to first model
      setFetched(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch models. Check URL and API Key.');
    } finally {
      setLoading(false);
    }
  };

  // ── Save credentials and go to main app ─────────────────
  const handleLaunch = () => {
    if (!model) { setError('Please select a model.'); return; }
    setCredentials({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), model });
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg)' }}>
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-md px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right,transparent,${rgba('teal',0.6)})` }} />
            <span className="text-xs font-mono tracking-[0.3em] uppercase" style={{ color: rgba('teal',0.6) }}>
              TCS GenAI Lab
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left,transparent,${rgba('teal',0.6)})` }} />
          </div>
          <h1 className="font-display font-bold text-white text-4xl leading-tight">
            Hackathon
            <span className="block" style={{ color: rgba('teal',1) }}>Orchestration Engine</span>
          </h1>
          <p className="text-white/40 text-xs mt-3 tracking-widest uppercase font-body">
            Enter as a Learner — Exit as an AI Engineer
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-7 border-teal-neon space-y-5">
          <h2 className="font-display font-semibold text-white text-lg tracking-wide">
            Connect to LLM Endpoint
          </h2>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-2"
              style={{ color: rgba('teal',0.8) }}>
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => { setBaseUrl(e.target.value); setFetched(false); setModels([]); }}
              placeholder="https://genailab.tcs.in"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = rgba('teal',0.6)}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-2"
              style={{ color: rgba('teal',0.8) }}>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setFetched(false); setModels([]); }}
              placeholder="Enter your API key"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = rgba('teal',0.6)}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {/* Fetch Models Button */}
          <button
            onClick={handleFetchModels}
            disabled={loading}
            className="w-full py-3 rounded-xl font-display font-semibold text-base uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg,${rgba('teal',0.2)},${rgba('teal',0.05)})`,
              border: `1px solid ${rgba('teal',0.5)}`,
              color: rgba('teal',1),
            }}>
            {loading ? '⟳ Fetching Models...' : '⚡ Fetch Available Models'}
          </button>

          {/* Model Dropdown — shown after fetch */}
          {fetched && models.length > 0 && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-2"
                style={{ color: rgba('gold',0.8) }}>
                Select Model
              </label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300d4c8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem',
                  borderColor: rgba('gold',0.4),
                }}>
                {models.map(m => (
                  <option key={m.id} value={m.id}
                    style={{ background: '#0a1628', color: 'white' }}>
                    {m.id}
                  </option>
                ))}
              </select>
              <p className="text-white/30 text-xs mt-1 font-mono">
                {models.length} model{models.length !== 1 ? 's' : ''} available
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border-red-neon rounded-lg px-4 py-3">
              <p className="text-sm" style={{ color: rgba('red',1) }}>{error}</p>
            </div>
          )}

          {/* Launch Button */}
          {fetched && model && (
            <button
              onClick={handleLaunch}
              className="w-full py-4 rounded-xl font-display font-bold text-xl uppercase tracking-widest transition-all duration-300"
              style={{
                background: `linear-gradient(135deg,${rgba('gold',0.25)},${rgba('gold',0.1)})`,
                border: `2px solid ${rgba('gold',0.7)}`,
                color: rgba('gold',1),
                boxShadow: `0 0 30px ${rgba('gold',0.3)}`,
              }}>
              🚀 Launch Engine
            </button>
          )}
        </div>

        <p className="text-center text-white/15 text-xs font-mono mt-6 tracking-widest uppercase">
          Co-Creators Team · TCS GenAI Lab Coimbatore
        </p>
      </div>
    </div>
  );
}
