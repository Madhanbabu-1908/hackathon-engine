# TCS GenAI Lab — Hackathon Orchestration Engine
> *Enter as a Learner — Exit as an AI Engineer*

Built by the **Co-Creators Team** · TCS GenAI Lab Coimbatore

---

## Quick Start

### Option A — Batch File (Windows)
Double-click `start.bat`
- Installs all dependencies automatically on first run
- Opens two terminal windows (server + client)
- Launches browser at `http://localhost:5173`

### Option B — Manual (VS Code Terminal)
```bash
# From project root — install all dependencies once
npm run install:all

# Then start both server + client together
npm run dev
```

---

## First-Time Setup

1. Open `server/.env`
2. Replace `xxxxx` with your actual TCS GenAI API key:
   ```
   GENAI_API_KEY=your_actual_key_here
   GENAI_BASE_URL=https://genailab.tcs.in
   GENAI_MODEL=genailab-maas-gpt-4o
   ```

---

## File Structure

```
hackathon-engine/
├── start.bat                    ← Double-click to launch
├── package.json                 ← Root (concurrently)
│
├── server/
│   ├── .env                     ← API keys (edit this first)
│   ├── index.js                 ← Express server entry
│   ├── db.js                    ← SQLite schema + connection
│   └── routes/
│       ├── session.js           ← Session CRUD + phase transitions
│       ├── questions.js         ← LLM generation + caching
│       ├── draft.js             ← Spin wheel game logic
│       └── archive.js          ← Historical session data
│
└── client/
    └── src/
        ├── pages/
        │   ├── Home.jsx         ← Landing screen
        │   ├── Setup.jsx        ← Session initialization
        │   ├── SpinWheel.jsx    ← Phase 2: Draft wheel
        │   ├── Challenge.jsx    ← 60s MCQ timer screen
        │   ├── HackathonActive.jsx ← Running state
        │   ├── Evaluation.jsx   ← Presentation order draw
        │   ├── ResumePicker.jsx ← Choose incomplete session
        │   ├── Archives.jsx     ← Completed sessions list
        │   └── ArchiveDetail.jsx ← Full session history
        ├── components/
        │   ├── Layout.jsx       ← Header/footer wrapper
        │   ├── ParticleBackground.jsx ← Canvas particle field
        │   └── StrikeBoard.jsx  ← Live team strike tracker
        └── hooks/
            └── useAudio.js      ← Web Audio API synth sounds
```

---

## Session Flow

```
Home → Setup (enter names + difficulty)
     → Phase 2: Spin Wheel (draft use cases)
       → Challenge (60s MCQ per team)
     → Hackathon Active (running state)
     → Evaluation Mode (presentation order draw)
     → Archive (saved forever in SQLite)
```

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS    |
| Backend  | Node.js + Express                 |
| Database | SQLite via better-sqlite3         |
| LLM      | OpenAI-compatible (TCS endpoint)  |
| Audio    | Web Audio API (no files needed)   |
| Fonts    | Rajdhani · Exo 2 · Share Tech Mono|

---

## Notes

- **SSL**: TCS internal endpoint SSL verification is disabled automatically via `DISABLE_SSL_VERIFY=true` in `.env`
- **Crash recovery**: SQLite WAL mode ensures zero data loss on power cut or browser crash
- **Audio**: All sounds are synthesized in-browser — no `.mp3` files required
- **Max teams**: 6 (configurable 2–6 per session)
- **Questions**: 20 pre-cached per session, pulled one at a time during challenges
