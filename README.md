# AI Text Humanizer Web App

Production-ready full-stack app for rewriting robotic or AI-generated text into natural, human-like writing while preserving meaning.

## Stack
- **Frontend:** React + TailwindCSS (Vite)
- **Backend:** Node.js + Express
- **AI:** OpenAI API (with deterministic local fallback when API key is missing)

## Features
- Three rewrite modes: **light**, **standard**, **advanced**
- Up to **5000 words** per request
- Preserves paragraph structure
- Human-likeness score (0-100) + per-metric breakdown
- In-memory response caching for repeated requests
- Copy-to-clipboard + TXT download
- Dark mode toggle

## API
### `POST /api/humanize`

Request:
```json
{
  "text": "...",
  "mode": "light | standard | advanced"
}
```

Response:
```json
{
  "humanized_text": "...",
  "score": 92
}
```

## Run locally
```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Environment variables
Create `.env` in project root or backend environment:

```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
PORT=4000
```

If `OPENAI_API_KEY` is not configured, the API uses a local fallback rewriter so the app still works.
