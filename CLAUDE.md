# CLAUDE.md

Guidance for an LLM coder working in this repo. Read this first — it maps the project so you can skip broad exploration.

## What this is

**PlaylistMind** (package name `playlist-mind`) — a Next.js 16 PWA that turns YouTube playlists into prioritized, AI-summarized knowledge bases. Runs with **zero credentials in explicit demo mode** (fixture-backed); real providers activate via env vars.

Stack: Next.js 16 (App Router, React 19), TypeScript, Tailwind v4, Zod v4, Vitest + Playwright. Deploys on Vercel. Optional Supabase (Postgres + Edge Function relay).

## Architecture in one pass

Data flows through three swappable **provider** interfaces defined in [src/providers/contracts.ts](src/providers/contracts.ts):

1. **`YouTubeMetadataProvider`** — playlist/video metadata. Impl: [youtube.ts](src/providers/youtube.ts) (`YouTubeDataApiProvider`, uses `YOUTUBE_API_KEY`).
2. **`TranscriptProvider`** — fetches captions. Multiple impls selected by env (see below).
3. **`AIProvider`** — analyze / summarize / clean-transcript / Q&A. Impl: [openrouter.ts](src/providers/openrouter.ts) (`OpenRouterProvider`, OpenAI-compatible). Model picked per-task by [model-routing.ts](src/providers/model-routing.ts): triage→`AI_MODEL_CHEAP`, default→`AI_MODEL_DEFAULT`, synthesis→`AI_MODEL_DEEP`.

**No real database for app state.** Playlists live in browser `localStorage` (key `playlist-mind-v1`) via [src/data/store.ts](src/data/store.ts); demo fixtures in [src/data/demo.ts](src/data/demo.ts). Supabase is used only for the optional transcript relay (and the migration in `supabase/migrations/`), not for playlist persistence.

### Layout
- `src/app/` — routes + API. API routes: `api/ai/{analyze,summarize,clean-transcript}`, `api/playlists/import`, `api/transcripts/[videoId]`, `api/health`. API routes validate input with Zod and map errors via [src/domain/errors.ts](src/domain/errors.ts) (`mapExternalError` → `{code,message,retryable}`).
- `src/domain/` — pure types + logic, no I/O. Core types in [types.ts](src/domain/types.ts) (`Video`, `Playlist`, `PlaylistAnalysis`). Each `*.ts` has a colocated `*.test.ts`.
- `src/providers/` — all external I/O lives here behind the contracts above.
- `src/components/` — client React (`"use client"`).
- `supabase/functions/youtube-transcript/` — Deno Edge Function; standalone transcript relay (npm specifiers, not the src tree).

## Transcript fetching — the central problem of this project

YouTube blocks datacenter/serverless IPs (Vercel, Supabase), so caption fetching needs a workaround. The selection logic is `transcriptProviderFromEnv()` in [transcripts.ts:91](src/providers/transcripts.ts#L91), in **strict precedence order**:

1. `TRANSCRIPT_API_KEY` → `ManagedTranscriptProvider` (paid youtubetranscript.dev) — **wins if set**.
2. `TRANSCRIPT_PROXY_URL` → `YouTubeTranscriptProvider` over an HTTP(S) proxy. Routes watch page + Innertube player + transcript download through one proxy IP.
3. `TRANSCRIPT_SUPABASE_URL` + `TRANSCRIPT_FUNCTION_SECRET` → `ExternalTranscriptProvider` (free Supabase Edge relay).
4. Fallback → `YouTubeTranscriptProvider` direct (works locally, usually IP-blocked in prod).

All built on the `youtube-transcript-plus` library, which makes **~3 requests per transcript** (watch → `youtubei/v1/player` POST → timedtext). Keep `TRANSCRIPT_CONCURRENCY=1` for proxy/relay modes to avoid rate limiting.

**Gotcha — ambiguous errors:** YouTube returns `NotAvailableError` both when captions are genuinely absent AND when the IP is blocked. The code deliberately reports the latter as `status: "failed"` (not `"unavailable"`) so it doesn't lie about captions existing — see [youtube-transcript.ts:69-74](src/providers/youtube-transcript.ts#L69). Preserve this distinction.

## Conventions

- **Demo mode is a feature, not a fallback to hide.** Demo content is always visibly labeled; never present title/description metadata as a transcript-grounded summary.
- Providers are constructed from env at the API-route boundary; domain code stays pure and testable.
- Code style here is **dense** (multi-statement lines, inline objects). Match it.
- Tests are colocated `*.test.ts` (Vitest). Add one when you touch `domain/` or `providers/`.

## Commands

```bash
npm run dev         # local dev
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run
npm run build       # next build
npm run test:e2e    # playwright (needs: npx playwright install chromium)
```

Always run `typecheck`, `lint`, and `test` before declaring a change done.

## Env vars (all optional; absence → demo mode)

See [.env.example](.env.example). Key groups: `YOUTUBE_API_KEY` (metadata); `OPENROUTER_API_KEY` + all three `AI_MODEL_*` (AI); the `TRANSCRIPT_*` set above; `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SECRET_KEY` (relay only). Limits: `MAX_VIDEOS_PER_BATCH` (25), `MAX_AI_INPUT_CHARS` (160k, split across transcripts per request).
</content>
</invoke>
