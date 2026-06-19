const { Router } = require('express');
const OpenAI = require('openai');
const https = require('https');
const db = require('../db.js');

const router = Router();

function getLLMClient(req) {
  const apiKey  = req.headers['x-api-key']  || process.env.GENAI_API_KEY;
  const baseURL = req.headers['x-base-url'] || process.env.GENAI_BASE_URL;
  return {
    client: new OpenAI({
      apiKey,
      baseURL,
      httpAgent: new https.Agent({ rejectUnauthorized: false }),
    }),
    model: req.headers['x-model'] || process.env.GENAI_MODEL,
  };
}

router.post('/generate', async (req, res) => {
  const { session_id, difficulty } = req.body;
  if (!session_id || !difficulty)
    return res.status(400).json({ error: 'session_id and difficulty required.' });

  const existing = db.get(`SELECT COUNT(*) as count FROM question_pool WHERE session_id = ?`, [session_id]);
  if (existing.count > 0)
    return res.json({ success: true, cached: true, count: existing.count });

  const prompt = `Generate exactly 20 unique multiple-choice questions about Generative AI, Prompt Engineering, Vector Databases, and LLM Architectures at ${difficulty} difficulty.

Return ONLY a valid JSON array, no markdown, no explanation:
[{"question":"...","options":["A","B","C","D"],"correct_idx":0}]

Exactly 20 items. correct_idx is 0-based.`;

  try {
    const { client, model } = getLLMClient(req);
    console.log(`[LLM] Generating 20 questions — difficulty: ${difficulty}, model: ${model}`);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Output ONLY a valid JSON array. No markdown, no explanation.' },
        { role: 'user',   content: prompt },
      ],
      max_tokens: 4000,
    });

    const rawText = completion.choices[0]?.message?.content?.trim();
    if (!rawText) throw new Error('Empty response from LLM.');
    const questions = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    if (!Array.isArray(questions) || questions.length === 0)
      throw new Error('LLM returned invalid format.');

    questions.forEach(q => {
      db.run(
        `INSERT INTO question_pool (session_id, question, options, correct_idx, used) VALUES (?, ?, ?, ?, 0)`,
        [session_id, q.question, JSON.stringify(q.options), q.correct_idx]
      );
    });

    console.log(`[LLM] Cached ${questions.length} questions for session ${session_id}`);
    res.json({ success: true, cached: false, count: questions.length });
  } catch (err) {
    console.error('[LLM] Error:', err.message);
    res.status(500).json({ error: 'Failed to generate questions.', detail: err.message });
  }
});

router.get('/next/:session_id', (req, res) => {
  const question = db.get(
    `SELECT * FROM question_pool WHERE session_id = ? AND used = 0 ORDER BY id ASC LIMIT 1`,
    [req.params.session_id]
  );
  if (!question) return res.status(404).json({ error: 'No unused questions remaining.' });
  db.run(`UPDATE question_pool SET used = 1 WHERE id = ?`, [question.id]);
  res.json({
    id:          question.id,
    question:    question.question,
    options:     JSON.parse(question.options),
    correct_idx: question.correct_idx,
  });
});

module.exports = router;
