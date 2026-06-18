import type { TranscriptProvider, TranscriptResult } from "./contracts";
import { decode } from "html-entities";
import { YouTubeTranscriptProvider } from "./youtube-transcript";

export class UnconfiguredTranscriptProvider implements TranscriptProvider {
  async getTranscript(): Promise<TranscriptResult> { return { status: "unavailable" }; }
}

export class ExternalTranscriptProvider implements TranscriptProvider {
  constructor(
    private readonly endpoint: string,
    private readonly secret?: string,
    private readonly language?: string,
  ) {}
  async getTranscript(videoId: string): Promise<TranscriptResult> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.secret ? { "x-transcript-secret": this.secret } : {}),
      },
      body: JSON.stringify({ videoId, ...(this.language ? { language: this.language } : {}) }),
    });
    if (response.status === 404) return { status: "unavailable" };
    if (!response.ok) return { status: "failed" };
    const data = await response.json() as TranscriptResult;
    return data.transcript
      ? { status: "available", transcript: data.transcript }
      : { status: data.status ?? "unavailable", ...(data.reason ? { reason: data.reason } : {}) };
  }
}

type ManagedTranscriptSegment = { text?: unknown };
type ManagedTranscriptResponse = {
  status?: unknown;
  data?: { transcript?: unknown };
  transcript?: unknown;
};

function transcriptText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "text" in value) {
    return typeof value.text === "string" ? value.text.trim() : "";
  }
  if (Array.isArray(value)) {
    return value
      .map((segment: ManagedTranscriptSegment) => typeof segment?.text === "string" ? segment.text : "")
      .map((text) => decode(text).replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

/** Production-safe provider for https://youtubetranscript.dev/api/v2/transcribe. */
export class ManagedTranscriptProvider implements TranscriptProvider {
  constructor(
    private readonly token: string,
    private readonly endpoint = "https://youtubetranscript.dev/api/v2/transcribe",
    private readonly language?: string,
  ) {}

  async getTranscript(videoId: string): Promise<TranscriptResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, "content-type": "application/json" },
        body: JSON.stringify({ video: videoId, ...(this.language ? { language: this.language } : {}) }),
        signal: controller.signal,
      });
      if (response.status === 404) return { status: "unavailable" };
      if (!response.ok) {
        console.warn("managed_transcript_fetch_failed", { videoId, status: response.status });
        return { status: "failed" };
      }
      const data = await response.json() as ManagedTranscriptResponse;
      if (data.status === "processing") return { status: "processing" };
      const transcript = transcriptText(data.data?.transcript ?? data.transcript);
      return transcript ? { status: "available", transcript } : { status: "failed" };
    } catch (error) {
      console.warn("managed_transcript_fetch_failed", { videoId, error: error instanceof Error ? error.name : "unknown" });
      return { status: "failed" };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function transcriptProviderFromEnv(env: Record<string, string | undefined> = process.env): TranscriptProvider {
  if (env.TRANSCRIPT_API_KEY) {
    return new ManagedTranscriptProvider(
      env.TRANSCRIPT_API_KEY,
      env.TRANSCRIPT_API_URL || undefined,
      env.TRANSCRIPT_LANGUAGE || undefined,
    );
  }
  if (env.TRANSCRIPT_PROXY_URL) {
    try {
      const proxyUrl = new URL(env.TRANSCRIPT_PROXY_URL);
      if (proxyUrl.protocol === "http:" || proxyUrl.protocol === "https:") {
        return new YouTubeTranscriptProvider(env.TRANSCRIPT_LANGUAGE || undefined, proxyUrl.toString());
      }
      console.warn("unsupported_transcript_proxy_protocol", { protocol: proxyUrl.protocol });
    } catch {
      console.warn("invalid_transcript_proxy_url");
    }
  }
  if (env.TRANSCRIPT_SUPABASE_URL && env.TRANSCRIPT_FUNCTION_SECRET) {
    return new ExternalTranscriptProvider(
      env.TRANSCRIPT_SUPABASE_URL,
      env.TRANSCRIPT_FUNCTION_SECRET,
      env.TRANSCRIPT_LANGUAGE || undefined,
    );
  }
  return new YouTubeTranscriptProvider(env.TRANSCRIPT_LANGUAGE || undefined);
}
