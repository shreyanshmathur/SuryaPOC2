# Surya Integrated Growth & Care PoC Suite

Production-style PoC web application for Surya Hospitals, covering:

- Surya Parent Circle: Telegram + AI pediatric community inbox with doctor-reviewed responses.
- Surya Revenue Recovery Engine: prescription, pharmacy, and test leakage workflows.
- Surya Command Centre: leadership dashboard across operations, revenue, marketing, call centre, retention, and data quality.

This is a demo PoC only. It does not diagnose, prescribe, or replace a doctor. AI drafts, classifies, summarizes, and routes. Clinical messages require review before final sending.

## Local Development

```bash
npm install
cp .env.example .env
npm run server
npm run dev
```

Open `http://127.0.0.1:5173`.

## Environment Variables

Set these locally or in the backend host:

```bash
PORT=8787
GROQ_API_KEY=...
GROQ_BACKUP_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
TELEGRAM_BOT_TOKEN=...
TELEGRAM_POLLING=true
```

For Netlify frontend builds, either leave `VITE_API_BASE` blank and use the `/api` redirect in `netlify.toml`, or set:

```bash
VITE_API_BASE=https://your-backend-host.example.com
```

Never commit `.env`.

## Deploy Frontend to Netlify

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

Copy variables from `netlify.env.example` into Netlify environment variables. Keep `VITE_API_BASE` blank to use the bundled Netlify Function API.

The frontend can be deployed directly from GitHub. The bundled Netlify Function supports demo API actions. For live Telegram polling, deploy the backend separately because Netlify Functions do not run continuously.

## Deploy Backend

The Express backend is ready for Render using `render.yaml`.

Required Render environment variables:

- `GROQ_API_KEY`
- `GROQ_BACKUP_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_POLLING=true`

Copy variables from `backend.env.example` into the backend host environment.

Render start command:

```bash
node server/index.js
```

## OCR Support

Prescription Intelligence supports image uploads and PDF uploads. PDFs are rendered server-side into image frames and sent to Groq Vision OCR, with all extracted prescriptions marked reviewable.
