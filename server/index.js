import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';

import sessionRoutes from './routes/session.js';
import questionRoutes from './routes/questions.js';
import archiveRoutes from './routes/archive.js';
import draftRoutes from './routes/draft.js';
import modelsRoutes from './routes/models.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Fix __dirname for ESM (IMPORTANT for pkg)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
