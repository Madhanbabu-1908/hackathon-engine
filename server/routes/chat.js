const { Router } = require('express');
const OpenAI = require('openai');
const https = require('https');

const router = Router();

// POST /api/chat
router.post('/', async (req, res) => {
  const { message, model, base_url, api_key } = req.body;

  if (!message || !model || !base_url || !api_key) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const client = new OpenAI({
      apiKey: api_key,
      baseURL: base_url,
      httpAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant for a hackathon event. Keep answers concise and encouraging.' },
        { role: 'user', content: message }
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('[CHAT] Error:', err.message);
    res.status(500).json({ error: 'Failed to get response from LLM.', detail: err.message });
  }
});

module.exports = router;
