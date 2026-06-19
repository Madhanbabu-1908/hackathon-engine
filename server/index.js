const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db.js');

const sessionRoutes  = require('./routes/session.js');
const questionRoutes = require('./routes/questions.js');
const archiveRoutes  = require('./routes/archive.js');
const draftRoutes    = require('./routes/draft.js');
const modelsRoutes   = require('./routes/models.js');
const chatRoutes = require('./routes/chat.js');

const app = express();
const PORT = process.env.PORT || 3001;

const envDir = process.pkg ? path.dirname(process.execPath) : __dirname;
dotenv.config({ path: path.join(envDir, '.env') });

// ==========================
// CORS (DEV + PROD SAFE)
// ==========================
app.use(cors({
  origin: true, // allows any origin (safe for local EXE usage)
  allowedHeaders: [
    'Content-Type',
    'x-api-key',
    'x-base-url',
    'x-model'
  ]
}));

app.use(express.json());

// ==========================
// INIT DB (safe async)
// ==========================
(async () => {
  try {
    await initDB();
    console.log('[DB] Initialized successfully');
  } catch (err) {
    console.error('[DB] Init failed:', err);
  }
})();

// ==========================
// API ROUTES
// ==========================
app.use('/api/sessions', sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/draft', draftRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ==========================
// SERVE FRONTEND (IMPORTANT)
// ==========================
const clientDistPath = path.join(__dirname, '../client/dist');

app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});
