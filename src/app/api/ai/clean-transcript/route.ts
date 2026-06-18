import { NextResponse } from "next/server";
import { z } from "zod";
import { mapExternalError } from "@/domain/errors";
import { chunkTranscript } from "@/domain/transcript-format";
import { OpenRouterProvider } from "@/providers/openrouter";

const requestSchema = z.object({ transcript: z.string().min(30).max(Number(process.env.MAX_AI_INPUT_CHARS ?? 160_000)), language: z.enum(["en", "ru", "uk", "es", "de", "fr", "pt", "pl"]) });

export async function POST(request: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: { code: "NOT_CONFIGURED", message: "OpenRouter is not configured." } }, { status: 503 });
    const { transcript, language } = requestSchema.parse(await request.json());
    const chunks = chunkTranscript(transcript);
    const cleaned = new Array<string>(chunks.length);
    const provider = new OpenRouterProvider(process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_BASE_URL);
    let index = 0;
    async function worker() {
      while (index < chunks.length) {
        const current = index++;
        cleaned[current] = await provider.cleanTranscriptChunk({ text: chunks[current], part: current + 1, total: chunks.length, language });
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, chunks.length) }, worker));
    return NextResponse.json({ cleanedTranscript: cleaned.join("\n\n") });
  } catch (error) {
    const mapped = mapExternalError(error);
    console.error("transcript_cleanup_failed", { code: mapped.code });
    return NextResponse.json({ error: { code: mapped.code, message: mapped.message, retryable: mapped.retryable } }, { status: 502 });
  }
}
