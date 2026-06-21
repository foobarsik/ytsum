# Signalcut

Production-oriented MVP PWA for turning YouTube playlists into prioritized knowledge bases. It runs without credentials in an explicit fixture-backed demo mode.

The Channel Watchlist monitors up to 20 research channels, checks their uploads playlist for new videos, reviews available transcripts for new claims, position changes, marketing signals, reasoning risks, content-quality risks, and early signals, and builds a rolling seven-day digest. Stale channels are checked when the Watchlist page opens and can also be refreshed manually.

## Run

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to enable providers. Live YouTube metadata requires `YOUTUBE_API_KEY`; server-side AI uses OpenRouter and requires `OPENROUTER_API_KEY` plus all three `AI_MODEL_*` values. `OPENROUTER_BASE_URL` defaults to `https://openrouter.ai/api/v1`. Apply both migrations in `supabase/migrations` to a Supabase project and provide the public URL and publishable key.

## Authentication

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are configured, `/watchlist` and its API routes require a Supabase Auth session. Sign-in uses passwordless email magic links and server-validated cookie sessions. Add these redirect URLs in Supabase Auth URL Configuration:

```text
http://localhost:3000/auth/callback
https://your-production-domain.example/auth/callback
```

Keep the secret/service-role key server-only. The browser auth client uses only the publishable key. Watchlist channels, tracked videos, and AI reviews are stored per user in RLS-protected Supabase tables. Existing browser data is imported once and removed from local storage after a successful migration.

Available manual and auto-generated YouTube captions are fetched during playlist import. Locally, the app uses `youtube-transcript-plus`. Serverless/datacenter IPs are commonly blocked by YouTube, so production deployments should set `TRANSCRIPT_API_KEY` for the managed `youtubetranscript.dev` endpoint. `TRANSCRIPT_API_URL` can override that endpoint. `TRANSCRIPT_LANGUAGE` optionally selects a BCP 47 language; leaving it empty uses the video's default caption track. `TRANSCRIPT_CONCURRENCY` controls parallel requests.

For the free Supabase relay, deploy `supabase/functions/youtube-transcript`, set the same random `TRANSCRIPT_FUNCTION_SECRET` in Supabase and Vercel, and set `TRANSCRIPT_SUPABASE_URL` in Vercel to `https://<project-ref>.supabase.co/functions/v1/youtube-transcript`. Set `TRANSCRIPT_CONCURRENCY=1` to reduce the risk of YouTube rate limiting. The paid `TRANSCRIPT_API_KEY` provider takes precedence when both are configured.

For an HTTP(S) proxy, set the server-only `TRANSCRIPT_PROXY_URL` to `http://user:password@host:port`. Proxy mode takes precedence over the Supabase relay and routes the watch page, Innertube player call, and transcript download through the same proxy IP. Keep `TRANSCRIPT_CONCURRENCY=1`.

## Watchlist automation

The Watchlist UI persists channel, video, and review state to Supabase. The channel-watchlist migration also provides weekly-digest storage and a `next_check_at` index for a future scheduled worker.

Supabase Cron can invoke an Edge Function on a recurring schedule, but the job should be enabled only after Auth is connected and the worker persists reviews to these tables. The weekly digest is intended to be read inside the Watchlist dashboard; email delivery is outside the current scope.

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
