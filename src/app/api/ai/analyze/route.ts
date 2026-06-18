import { NextResponse } from "next/server";
import { z } from "zod";
import { OpenRouterProvider } from "@/providers/openrouter";
import { mapExternalError } from "@/domain/errors";

const requestSchema = z.object({
  mode: z.enum(["inbox", "learning", "research"]), depth: z.enum(["brief", "normal", "deep"]),
  videos: z.array(z.object({ id: z.string(), youtubeId: z.string(), title: z.string(), channel: z.string(), duration: z.string(), publishedAt: z.string(), thumbnail: z.string(), transcriptStatus: z.enum(["available", "unavailable", "processing", "failed", "manually_added"]), transcript: z.string().optional(), priority: z.enum(["recommended", "low", "unclear"]), priorityReason: z.string(), summary: z.string().optional(), keyPoints: z.array(z.string()).optional(), actionItems: z.array(z.string()).optional() })).max(Number(process.env.MAX_VIDEOS_PER_BATCH ?? 25)),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: { code: "NOT_CONFIGURED", message: "OpenRouter AI analysis is not configured. Demo analysis remains available." } }, { status: 503 });
    const input = requestSchema.parse(await request.json());
    const chars = input.videos.reduce((sum, video) => sum + (video.transcript?.length ?? 0), 0);
    if (chars > Number(process.env.MAX_AI_INPUT_CHARS ?? 160_000)) return NextResponse.json({ error: { code: "COST_GUARD", message: "This batch is too large. Analyze fewer videos at a time." } }, { status: 413 });
    const provider = new OpenRouterProvider(process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_BASE_URL);
    return NextResponse.json(await provider.analyzePlaylist(input));
  } catch (error) { const mapped = mapExternalError(error); console.error("ai_analysis_failed", { code: mapped.code }); return NextResponse.json({ error: { code: mapped.code, message: mapped.message, retryable: mapped.retryable } }, { status: 502 }); }
}
