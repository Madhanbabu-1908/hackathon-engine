// ============================================================
// routes/models.js — Proxy endpoint to fetch available models
// from the TCS MaaS endpoint. Avoids CORS issues from browser.
// ============================================================

const { Router } = require('express');
const OpenAI = require('openai');
const https = require('https');

const router = Router();

// POST /api/models/list
// Body: { base_url, api_key }
router.post('/list', async (req, res) => {
  const { base_url, api_key } = req.body;

  if (!base_url || !api_key)
    return res.status(400).json({ error: 'base_url and api_key are required.' });

  try {
    const client = new OpenAI({
      apiKey:    api_key,
      baseURL:   base_url,
      httpAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    const response = await client.models.list();

    const models = (response.data || []).filter(m => {
      const id = m.id.toLowerCase();
      return !id.includes('embed') && !id.includes('embedding') && !id.includes('ada');
    });

    models.sort((a, b) => a.id.localeCompare(b.id));

    console.log(`[MODELS] Fetched ${models.length} models from ${base_url}`);
    res.json({ models });

  } catch (err) {
    console.error('[MODELS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch models.', detail: err.message });
  }
});

module.exports = router;
