import { NextResponse } from "next/server";
import { z } from "zod";
import { OpenRouterProvider } from "@/providers/openrouter";
import { mapExternalError } from "@/domain/errors";

const requestSchema = z.object({
  mode: z.enum(["inbox", "learning", "research"]),
  depth: z.enum(["brief", "normal", "deep"]),
  videos: z
    .array(
      z.object({
        id: z.string(),
        youtubeId: z.string(),
        title: z.string(),
        channel: z.string(),
        duration: z.string(),
        publishedAt: z.string(),
        thumbnail: z.string(),
        transcriptStatus: z.enum([
          "available",
          "unavailable",
          "processing",
          "failed",
          "manually_added",
        ]),
        transcript: z.string().optional(),
        priority: z.enum(["recommended", "low", "unclear"]),
        priorityReason: z.string(),
        summary: z.string().optional(),
        keyPoints: z.array(z.string()).optional(),
        actionItems: z.array(z.string()).optional(),
      }),
    )
    .max(Number(process.env.MAX_VIDEOS_PER_BATCH ?? 25)),
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY)
      return NextResponse.json(
        {
          error: {
            code: "NOT_CONFIGURED",
            message: "OpenRouter AI analysis is not configured. Demo analysis remains available.",
          },
        },
        { status: 503 },
      );
    const input = requestSchema.parse(await request.json());
    const transcriptCount = input.videos.filter((video) => video.transcript).length;
    const perTranscriptLimit = Math.floor(
      Number(process.env.MAX_AI_INPUT_CHARS ?? 160_000) / Math.max(transcriptCount, 1),
    );
    const videos = input.videos.map((video) =>
      video.transcript
        ? { ...video, transcript: video.transcript.slice(0, perTranscriptLimit) }
        : video,
    );
    const provider = new OpenRouterProvider(
      process.env.OPENROUTER_API_KEY,
      process.env.OPENROUTER_BASE_URL,
    );
    return NextResponse.json(await provider.analyzePlaylist({ ...input, videos }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn("ai_analysis_invalid_request", {
        issues: error.issues.map((issue) => issue.code),
      });
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: `Invalid analysis request. The batch may exceed the ${process.env.MAX_VIDEOS_PER_BATCH ?? 25}-video limit.`,
            retryable: false,
          },
        },
        { status: 400 },
      );
    }
    const mapped = mapExternalError(error);
    console.error("ai_analysis_failed", { code: mapped.code });
    return NextResponse.json(
      { error: { code: mapped.code, message: mapped.message, retryable: mapped.retryable } },
      { status: 502 },
    );
  }
}
