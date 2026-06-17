import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';

if (process.env.DISABLE_SSL_VERIFY === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('[SSL] Certificate verification disabled for internal TCS endpoints.');
}

import sessionRoutes  from './routes/session.js';
import questionRoutes from './routes/questions.js';
import archiveRoutes  from './routes/archive.js';
import draftRoutes    from './routes/draft.js';
import modelsRoutes   from './routes/models.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  allowedHeaders: ['Content-Type', 'x-api-key', 'x-base-url', 'x-model'],
}));
app.use(express.json());

await initDB();

app.use('/api/sessions',  sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/archive',   archiveRoutes);
app.use('/api/draft',     draftRoutes);
app.use('/api/models',    modelsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`[SERVER] Hackathon Engine running on http://localhost:${PORT}`);
});
