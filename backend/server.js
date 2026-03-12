const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const {
  MODES,
  validateMode,
  countWords,
  createCacheKey,
  fallbackHumanize,
  openAiHumanize,
} = require('./humanizer');
const { humanLikenessScore } = require('./scoring');

const app = express();
const PORT = process.env.PORT || 4000;
const MAX_WORDS = 5000;
const CACHE_TTL_MS = 15 * 60 * 1000;

const requestCache = new Map();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.cachedAt > CACHE_TTL_MS) {
      requestCache.delete(key);
    }
  }
}, CACHE_TTL_MS).unref();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', modes: Object.keys(MODES) });
});

app.post('/api/humanize', async (req, res) => {
  const start = Date.now();
  try {
    const { text = '', mode = 'standard' } = req.body || {};

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text is required.' });
    }

    const wordCount = countWords(text);
    if (wordCount > MAX_WORDS) {
      return res.status(413).json({ error: `Input exceeds ${MAX_WORDS} words.` });
    }

    const safeMode = validateMode(mode);
    const cacheKey = createCacheKey(text, safeMode);
    const cached = requestCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return res.json({ ...cached.payload, cached: true });
    }

    const humanizedText = openai
      ? await openAiHumanize(text, safeMode, openai)
      : fallbackHumanize(text, safeMode);

    const { score, metrics } = humanLikenessScore(humanizedText);

    const payload = {
      humanized_text: humanizedText,
      score,
      metrics,
      mode: safeMode,
      processing_ms: Date.now() - start,
    };

    requestCache.set(cacheKey, { payload, cachedAt: Date.now() });

    return res.json(payload);
  } catch (error) {
    console.error('Humanize failed:', error);
    return res.status(500).json({
      error: 'Failed to humanize text.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Humanizer API running on port ${PORT}`);
});
