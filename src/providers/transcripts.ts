import type { TranscriptProvider, TranscriptResult } from "./contracts";

export class UnconfiguredTranscriptProvider implements TranscriptProvider {
  async getTranscript(): Promise<TranscriptResult> { return { status: "unavailable" }; }
}

export class ExternalTranscriptProvider implements TranscriptProvider {
  constructor(private readonly endpoint: string, private readonly token?: string) {}
  async getTranscript(videoId: string): Promise<TranscriptResult> {
    const response = await fetch(`${this.endpoint.replace(/\/$/, "")}/${encodeURIComponent(videoId)}`, { headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined });
    if (response.status === 404) return { status: "unavailable" };
    if (!response.ok) return { status: "failed" };
    const data = await response.json() as TranscriptResult;
    return data.transcript ? { status: "available", transcript: data.transcript } : { status: data.status ?? "unavailable" };
  }
}
