import { afterEach, describe, expect, it, vi } from "vitest";
import { ExternalTranscriptProvider, ManagedTranscriptProvider, transcriptProviderFromEnv } from "./transcripts";
import { YouTubeTranscriptProvider } from "./youtube-transcript";

afterEach(() => vi.unstubAllGlobals());

describe("transcript provider selection", () => {
  it("uses the direct provider without a managed API key", () => {
    expect(transcriptProviderFromEnv({})).toBeInstanceOf(YouTubeTranscriptProvider);
  });

  it("uses the managed provider when configured", () => {
    expect(transcriptProviderFromEnv({ TRANSCRIPT_API_KEY: "test-key" })).toBeInstanceOf(ManagedTranscriptProvider);
  });

  it("uses the Supabase function when its URL and secret are configured", () => {
    expect(transcriptProviderFromEnv({
      TRANSCRIPT_SUPABASE_URL: "https://example.supabase.co/functions/v1/youtube-transcript",
      TRANSCRIPT_FUNCTION_SECRET: "secret",
    })).toBeInstanceOf(ExternalTranscriptProvider);
  });
});

describe("Supabase transcript provider", () => {
  it("sends the shared secret only from the server", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "available",
      transcript: "Caption text",
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(new ExternalTranscriptProvider("https://example.test/transcript", "shared-secret", "ru")
      .getTranscript("dQw4w9WgXcQ")).resolves.toEqual({ status: "available", transcript: "Caption text" });
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/transcript", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "x-transcript-secret": "shared-secret" }),
      body: JSON.stringify({ videoId: "dQw4w9WgXcQ", language: "ru" }),
    }));
  });

  it("preserves a safe provider failure reason", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "failed",
      reason: "youtube_rejected_request",
    }), { status: 200 })));

    await expect(new ExternalTranscriptProvider("https://example.test/transcript", "shared-secret")
      .getTranscript("WxZHUe8mvhU")).resolves.toEqual({
        status: "failed",
        reason: "youtube_rejected_request",
      });
  });
});

describe("managed transcript provider", () => {
  it("parses transcript text returned by the managed API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { transcript: { text: "First sentence. Second sentence." } },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await new ManagedTranscriptProvider("secret").getTranscript("dQw4w9WgXcQ");

    expect(result).toEqual({ status: "available", transcript: "First sentence. Second sentence." });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://youtubetranscript.dev/api/v2/transcribe",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ video: "dQw4w9WgXcQ" }) }),
    );
  });

  it("maps a confirmed no-captions response to unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(new ManagedTranscriptProvider("secret").getTranscript("dQw4w9WgXcQ"))
      .resolves.toEqual({ status: "unavailable" });
  });
});
