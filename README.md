# PlaylistMind

Production-oriented MVP PWA for turning YouTube playlists into prioritized knowledge bases. It runs without credentials in an explicit fixture-backed demo mode.

## Run

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to enable providers. Live YouTube metadata requires `YOUTUBE_API_KEY`; server-side AI uses OpenRouter and requires `OPENROUTER_API_KEY` plus all three `AI_MODEL_*` values. `OPENROUTER_BASE_URL` defaults to `https://openrouter.ai/api/v1`. Apply `supabase/migrations/20260618000000_initial_schema.sql` to a Supabase project and provide the public URL/publishable key plus a server-only secret key.

Available manual and auto-generated YouTube captions are fetched during playlist import through `youtube-transcript-plus`. `TRANSCRIPT_LANGUAGE` optionally selects a BCP 47 language; leaving it empty uses the video's default caption track. `TRANSCRIPT_CONCURRENCY` controls parallel requests.

## Verify

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Demo transcripts, summaries, analyses, and Q&A are visibly labeled. The app never presents title/description metadata as a transcript-grounded summary.
