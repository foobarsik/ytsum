import { NextResponse } from "next/server";
import { z } from "zod";
import { mapExternalError } from "@/domain/errors";
import { OpenRouterProvider } from "@/providers/openrouter";

const requestSchema = z.object({
  depth: z.enum(["brief", "normal", "deep"]),
  language: z.enum(["en", "ru", "uk", "es", "de", "fr", "pt", "pl"]),
  video: z.object({
    id: z.string(), youtubeId: z.string(), title: z.string(), channel: z.string(), duration: z.string(),
    publishedAt: z.string(), thumbnail: z.string(), transcriptStatus: z.enum(["available", "unavailable", "processing", "failed", "manually_added"]),
    transcript: z.string().min(30).max(Number(process.env.MAX_AI_INPUT_CHARS ?? 160_000)),
    priority: z.enum(["recommended", "low", "unclear"]), priorityReason: z.string(),
    summary: z.string().optional(), keyPoints: z.array(z.string()).optional(), actionItems: z.array(z.string()).optional(),
  }),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: { code: "NOT_CONFIGURED", message: "OpenRouter is not configured." } }, { status: 503 });
    const input = requestSchema.parse(await request.json());
    const provider = new OpenRouterProvider(process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_BASE_URL);
    return NextResponse.json(await provider.summarizeVideo(input));
  } catch (error) {
    const mapped = mapExternalError(error);
    console.error("video_summary_failed", { code: mapped.code });
    return NextResponse.json({ error: { code: mapped.code, message: mapped.message, retryable: mapped.retryable } }, { status: 502 });
  }
}
