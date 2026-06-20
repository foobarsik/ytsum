import { NextResponse } from "next/server";
import { z } from "zod";
import { mapExternalError } from "@/domain/errors";
import { watchlistInsightOutputSchema, watchlistSignalCandidateSchema } from "@/domain/schemas";
import { summaryLanguages } from "@/domain/summary-languages";
import { OpenRouterProvider } from "@/providers/openrouter";
import { transcriptProviderFromEnv } from "@/providers/transcripts";
import { getAuthState } from "@/lib/supabase/auth";

const requestSchema = z.object({
  channelTitle: z.string().min(1).max(200),
  videoTitle: z.string().min(1).max(300),
  videoDescription: z.string().max(20_000).default(""),
  youtubeId: z.string().regex(/^[\w-]{11}$/),
  topic: z.string().max(120),
  language: z.enum(summaryLanguages.map((language) => language.code)),
  priorInsights: z
    .array(
      watchlistInsightOutputSchema.extend({
        signals: z
          .array(watchlistSignalCandidateSchema.extend({ score: z.number() }))
          .max(8)
          .default([]),
        generatedAt: z.string(),
        model: z.string().optional(),
      }),
    )
    .max(8),
});

function providerErrorDetails(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const providerError = error as Error & { status?: number; code?: string; error?: unknown };
  return JSON.stringify({
    name: providerError.name,
    message: providerError.message,
    status: providerError.status,
    code: providerError.code,
    providerError: providerError.error,
  });
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthState();
    if (!auth.configured) {
      return NextResponse.json(
        { error: { code: "AUTH_NOT_CONFIGURED", message: "Supabase Auth is not configured." } },
        { status: 503 },
      );
    }
    if (!auth.claims) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in to analyze watchlist videos." } },
        { status: 401 },
      );
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "OpenRouter is not configured." } },
        { status: 503 },
      );
    }
    const input = requestSchema.parse(await request.json());
    const transcriptResult = await transcriptProviderFromEnv().getTranscript(input.youtubeId);
    if (!transcriptResult.transcript)
      return NextResponse.json({ transcriptStatus: transcriptResult.status });
    const provider = new OpenRouterProvider(
      process.env.OPENROUTER_API_KEY,
      process.env.OPENROUTER_BASE_URL,
    );
    const terms = await provider.inspectWatchlistTerms({
      transcript: transcriptResult.transcript,
      description: input.videoDescription,
      language: input.language,
    });
    const insight = await provider.analyzeWatchlistVideo({
      channelTitle: input.channelTitle,
      videoTitle: input.videoTitle,
      topic: input.topic,
      transcript: transcriptResult.transcript,
      terms,
      priorInsights: input.priorInsights,
      language: input.language,
    });
    return NextResponse.json({ transcriptStatus: "available", insight });
  } catch (error) {
    const mapped = mapExternalError(error);
    console.error("watchlist_analysis_failed", mapped.code, providerErrorDetails(error));
    return NextResponse.json(
      { error: { code: mapped.code, message: mapped.message, retryable: mapped.retryable } },
      { status: 502 },
    );
  }
}
