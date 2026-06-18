# PlaylistMind

Production-oriented MVP PWA for turning YouTube playlists into prioritized knowledge bases. It runs without credentials in an explicit fixture-backed demo mode.

## Run

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to enable providers. Live YouTube metadata requires `YOUTUBE_API_KEY`; server-side AI uses OpenRouter and requires `OPENROUTER_API_KEY` plus all three `AI_MODEL_*` values. `OPENROUTER_BASE_URL` defaults to `https://openrouter.ai/api/v1`. Apply `supabase/migrations/20260618000000_initial_schema.sql` to a Supabase project and provide the public URL/publishable key plus a server-only secret key.

Available manual and auto-generated YouTube captions are fetched during playlist import. Locally, the app uses `youtube-transcript-plus`. Serverless/datacenter IPs are commonly blocked by YouTube, so production deployments should set `TRANSCRIPT_API_KEY` for the managed `youtubetranscript.dev` endpoint. `TRANSCRIPT_API_URL` can override that endpoint. `TRANSCRIPT_LANGUAGE` optionally selects a BCP 47 language; leaving it empty uses the video's default caption track. `TRANSCRIPT_CONCURRENCY` controls parallel requests.

For the free Supabase relay, deploy `supabase/functions/youtube-transcript`, set the same random `TRANSCRIPT_FUNCTION_SECRET` in Supabase and Vercel, and set `TRANSCRIPT_SUPABASE_URL` in Vercel to `https://<project-ref>.supabase.co/functions/v1/youtube-transcript`. Set `TRANSCRIPT_CONCURRENCY=1` to reduce the risk of YouTube rate limiting. The paid `TRANSCRIPT_API_KEY` provider takes precedence when both are configured.

For an HTTP(S) proxy, set the server-only `TRANSCRIPT_PROXY_URL` to `http://user:password@host:port`. Proxy mode takes precedence over the Supabase relay and routes the watch page, Innertube player call, and transcript download through the same proxy IP. Keep `TRANSCRIPT_CONCURRENCY=1`.

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
