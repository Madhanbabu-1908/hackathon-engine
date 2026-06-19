const { Router } = require('express');
const db = require('../db.js');

const router = Router();

router.post('/create', (req, res) => {
  const { label, date_label, difficulty, teams } = req.body;

  if (!label || !date_label || !difficulty || !teams?.length)
    return res.status(400).json({ error: 'Missing required fields.' });
  if (teams.length < 2 || teams.length > 6)
    return res.status(400).json({ error: 'Team count must be between 2 and 6.' });

  try {
    db.run(
      `INSERT INTO sessions (label, date_label, difficulty, team_count, phase)
       VALUES (?, ?, ?, ?, 'SETUP')`,
      [label, date_label, difficulty, teams.length]
    );

    const session   = db.get(`SELECT id FROM sessions ORDER BY id DESC LIMIT 1`);
    const sessionId = session.id;

    teams.forEach((name, idx) => {
      db.run(
        `INSERT INTO teams (session_id, name, draft_order) VALUES (?, ?, ?)`,
        [sessionId, name.trim(), idx]
      );
    });

    res.json({ success: true, session_id: sessionId });
  } catch (err) {
    console.error('[SESSION] Create error:', err);
    res.status(500).json({ error: 'Failed to create session.' });
  }
});

router.get('/incomplete', (req, res) => {
  const sessions = db.all(
    `SELECT id, label, date_label, difficulty, team_count, phase, created_at, updated_at
     FROM sessions WHERE phase != 'COMPLETE' ORDER BY updated_at DESC`
  );
  res.json({ sessions });
});

router.get('/:id', (req, res) => {
  const session = db.get(`SELECT * FROM sessions WHERE id = ?`, [req.params.id]);
  if (!session) return res.status(404).json({ error: 'Session not found.' });

  const teams = db.all(
    `SELECT * FROM teams WHERE session_id = ? ORDER BY draft_order ASC`,
    [req.params.id]
  );

  const draftLog = db.all(
    `SELECT dl.*, t.name as team_name, qp.question, qp.options, qp.correct_idx
     FROM draft_log dl
     JOIN teams t ON dl.team_id = t.id
     LEFT JOIN question_pool qp ON dl.question_id = qp.id
     WHERE dl.session_id = ? ORDER BY dl.id ASC`,
    [req.params.id]
  );

  res.json({ session, teams, draft_log: draftLog });
});

router.patch('/:id/phase', (req, res) => {
  const { phase } = req.body;
  const valid = ['SETUP', 'DRAFT', 'ACTIVE', 'EVALUATION', 'COMPLETE'];
  if (!valid.includes(phase)) return res.status(400).json({ error: 'Invalid phase.' });

  db.run(
    `UPDATE sessions SET phase = ?, updated_at = datetime('now','localtime') WHERE id = ?`,
    [phase, req.params.id]
  );
  res.json({ success: true, phase });
});

router.patch('/:id/presentation-order', (req, res) => {
  const { order } = req.body;
  order.forEach((teamId, idx) => {
    db.run(
      `UPDATE teams SET present_order = ? WHERE id = ? AND session_id = ?`,
      [idx + 1, teamId, req.params.id]
    );
  });
  res.json({ success: true });
});

// ── DELETE /api/sessions/:id ─────────────────────────────────
// Hard delete — removes session + all related records
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  try {
    db.run(`DELETE FROM draft_log    WHERE session_id = ?`, [id]);
    db.run(`DELETE FROM question_pool WHERE session_id = ?`, [id]);
    db.run(`DELETE FROM teams        WHERE session_id = ?`, [id]);
    db.run(`DELETE FROM sessions     WHERE id = ?`,         [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[SESSION] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete session.' });
  }
});

module.exports = router;
