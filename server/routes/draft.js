const { Router } = require('express');
const db = require('../db.js');

const router = Router();

router.get('/queue/:session_id', (req, res) => {
  maybeReleaseWaiting(req.params.session_id);

  const queue = db.all(
    `SELECT id, name, strikes, draft_order, is_drafted, waiting
     FROM teams WHERE session_id = ? AND is_drafted = 0 AND waiting = 0
     ORDER BY draft_order ASC`,
    [req.params.session_id]
  );

  const waitingTeams = db.all(
    `SELECT id, name, strikes, is_drafted, waiting
     FROM teams WHERE session_id = ? AND is_drafted = 0 AND waiting = 1`,
    [req.params.session_id]
  );

  const allTeams = db.all(
    `SELECT id, name, strikes, use_case_num, is_drafted, waiting
     FROM teams WHERE session_id = ? ORDER BY draft_order ASC`,
    [req.params.session_id]
  );

  res.json({ queue, waiting: waitingTeams, all_teams: allTeams });
});

function maybeReleaseWaiting(session_id) {
  const activeRemaining = db.get(
    `SELECT COUNT(*) as cnt FROM teams
     WHERE session_id = ? AND is_drafted = 0 AND waiting = 0`,
    [session_id]
  );
  const hasWaiting = db.get(
    `SELECT COUNT(*) as cnt FROM teams
     WHERE session_id = ? AND is_drafted = 0 AND waiting = 1`,
    [session_id]
  );

  if (activeRemaining.cnt === 0 && hasWaiting.cnt > 0) {
    db.run(
      `UPDATE teams SET waiting = 0 WHERE session_id = ? AND is_drafted = 0`,
      [session_id]
    );
    console.log(`[DRAFT] Released waiting teams for session ${session_id}`);
  }
}

router.get('/usecase-pool/:session_id', (req, res) => {
  const session = db.get(`SELECT team_count FROM sessions WHERE id = ?`, [req.params.session_id]);
  if (!session) return res.status(404).json({ error: 'Session not found.' });

  const assigned = db.all(
    `SELECT use_case_num FROM teams WHERE session_id = ? AND use_case_num IS NOT NULL`,
    [req.params.session_id]
  ).map(r => r.use_case_num);

  const fullPool  = Array.from({ length: session.team_count }, (_, i) => i + 1);
  const available = fullPool.filter(n => !assigned.includes(n));
  res.json({ available, assigned });
});

router.post('/resolve', (req, res) => {
  const { session_id, team_id, question_id, selected_idx } = req.body;

  const team     = db.get(`SELECT * FROM teams WHERE id = ? AND session_id = ?`, [team_id, session_id]);
  const question = db.get(`SELECT * FROM question_pool WHERE id = ?`, [question_id]);

  if (!team || !question)
    return res.status(404).json({ error: 'Team or question not found.' });

  const isTimeout  = selected_idx === -1;
  const isCorrect  = !isTimeout && Number(selected_idx) === Number(question.correct_idx);
  const newStrikes = isCorrect ? team.strikes : team.strikes + 1;

  const attemptRow = db.get(
    `SELECT COUNT(*) as cnt FROM draft_log WHERE team_id = ? AND session_id = ?`,
    [team_id, session_id]
  );
  const attemptNum = (attemptRow?.cnt || 0) + 1;

  let useCaseNum = null;
  let outcome    = '';

  if (isCorrect) {
    useCaseNum = assignRandomUseCase(session_id);
    outcome    = 'CORRECT';
    db.run(
      `UPDATE teams SET strikes=?, use_case_num=?, is_drafted=1, waiting=0 WHERE id=?`,
      [newStrikes, useCaseNum, team_id]
    );

  } else if (newStrikes >= 3) {
    useCaseNum = assignRandomUseCase(session_id);
    outcome    = 'PITY_PASS';
    db.run(
      `UPDATE teams SET strikes=?, use_case_num=?, is_drafted=1, waiting=0 WHERE id=?`,
      [newStrikes, useCaseNum, team_id]
    );

  } else {
    outcome = isTimeout ? 'TIMEOUT' : 'WRONG';
    const maxRow = db.get(
      `SELECT MAX(draft_order) as maxOrd FROM teams WHERE session_id=? AND is_drafted=0`,
      [session_id]
    );
    db.run(
      `UPDATE teams SET strikes=?, draft_order=?, waiting=1 WHERE id=?`,
      [newStrikes, (maxRow?.maxOrd || 0) + 1, team_id]
    );
  }

  db.run(
    `INSERT INTO draft_log (session_id,team_id,question_id,selected_idx,correct,use_case_num,attempt_num)
     VALUES (?,?,?,?,?,?,?)`,
    [session_id, team_id, question_id, selected_idx, isCorrect?1:0, useCaseNum, attemptNum]
  );
  db.run(
    `UPDATE sessions SET updated_at=datetime('now','localtime') WHERE id=?`,
    [session_id]
  );

  res.json({
    outcome, use_case_num: useCaseNum, strikes: newStrikes,
    correct_idx: question.correct_idx,
    is_drafted: isCorrect || newStrikes >= 3,
  });
});

function assignRandomUseCase(session_id) {
  const session  = db.get(`SELECT team_count FROM sessions WHERE id=?`, [session_id]);
  const assigned = db.all(
    `SELECT use_case_num FROM teams WHERE session_id=? AND use_case_num IS NOT NULL`,
    [session_id]
  ).map(r => r.use_case_num);
  const available = Array.from({ length: session.team_count }, (_, i) => i+1)
    .filter(n => !assigned.includes(n));
  return available.length === 0 ? null : available[Math.floor(Math.random() * available.length)];
}

module.exports = router;
