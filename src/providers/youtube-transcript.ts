import { decode } from "html-entities";
import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
  type TranscriptSegment,
} from "youtube-transcript-plus";
import type { TranscriptProvider, TranscriptResult } from "./contracts";
import type { Video } from "@/domain/types";

export function segmentsToText(segments: TranscriptSegment[]): string {
  return segments
    .map((segment) => decode(segment.text).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
}

export class YouTubeTranscriptProvider implements TranscriptProvider {
  constructor(private readonly language?: string) {}

  async getTranscript(videoId: string): Promise<TranscriptResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const segments = await fetchTranscript(videoId, {
        ...(this.language ? { lang: this.language } : {}),
        retries: 1,
        retryDelay: 500,
        signal: controller.signal,
      });
      const transcript = segmentsToText(segments);
      return transcript ? { status: "available", transcript } : { status: "unavailable" };
    } catch (error) {
      if (
        error instanceof YoutubeTranscriptDisabledError ||
        error instanceof YoutubeTranscriptNotAvailableError ||
        error instanceof YoutubeTranscriptNotAvailableLanguageError ||
        error instanceof YoutubeTranscriptVideoUnavailableError
      ) return { status: "unavailable" };
      console.warn("transcript_fetch_failed", { videoId, error: error instanceof Error ? error.name : "unknown" });
      return { status: "failed" };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function enrichVideosWithTranscripts(
  videos: Video[],
  provider: TranscriptProvider,
  concurrency = 3,
): Promise<Video[]> {
  const enriched = [...videos];
  let index = 0;
  async function worker() {
    while (index < enriched.length) {
      const current = index++;
      const result = await provider.getTranscript(enriched[current].youtubeId);
      enriched[current] = {
        ...enriched[current],
        transcriptStatus: result.status,
        ...(result.transcript ? { transcript: result.transcript } : {}),
        priorityReason: result.transcript
          ? "Transcript imported. Run playlist analysis to calculate priority."
          : result.status === "failed"
            ? "Transcript import failed. Retry it or add one manually."
            : "No captions are available. Add a transcript manually.",
      };
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(concurrency, 1), videos.length) }, worker));
  return enriched;
}
