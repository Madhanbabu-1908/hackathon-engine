// ============================================================
// routes/archive.js — Completed session history
// ============================================================

const { Router } = require('express');
const db = require('../db.js');

const router = Router();

// ── GET /api/archive ─────────────────────────────────────────
router.get('/', (req, res) => {
  const sessions = db.all(
    `SELECT id, label, date_label, difficulty, team_count, phase, created_at, updated_at
     FROM sessions WHERE phase = 'COMPLETE' ORDER BY created_at DESC`
  );
  res.json({ sessions });
});

// ── GET /api/archive/:id ─────────────────────────────────────
router.get('/:id', (req, res) => {
  const session = db.get(`SELECT * FROM sessions WHERE id = ?`, [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Session not found.' });

  const teams = db.all(
    `SELECT * FROM teams WHERE session_id = ? ORDER BY present_order ASC, id ASC`,
    [req.params.id]
  );

  const draftLog = db.all(
    `SELECT dl.id, dl.team_id, t.name AS team_name, dl.attempt_num,
            qp.question, qp.options, qp.correct_idx,
            dl.selected_idx, dl.correct, dl.use_case_num, dl.created_at
     FROM draft_log dl
     JOIN teams t ON dl.team_id = t.id
     LEFT JOIN question_pool qp ON dl.question_id = qp.id
     WHERE dl.session_id = ? ORDER BY dl.id ASC`,
    [req.params.id]
  );

  const formattedLog = draftLog.map(entry => ({
    ...entry,
    options: entry.options ? JSON.parse(entry.options) : [],
  }));

  res.json({ session, teams, draft_log: formattedLog });
});

module.exports = router;
