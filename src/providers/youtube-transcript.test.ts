import { describe, expect, it } from "vitest";
import { demoPlaylists } from "@/data/demo";
import type { TranscriptProvider } from "./contracts";
import { enrichVideosWithTranscripts, segmentsToText } from "./youtube-transcript";

describe("YouTube transcript provider", () => {
  it("normalizes segments and decodes HTML entities", () => {
    expect(
      segmentsToText([
        { text: "We&#39;re  ready", duration: 1, offset: 0, lang: "en" },
        { text: "to &amp; fro", duration: 1, offset: 1, lang: "en" },
      ]),
    ).toBe("We're ready to & fro");
  });

  it("keeps per-video failures isolated while enriching a playlist", async () => {
    const provider: TranscriptProvider = {
      getTranscript: async (videoId) =>
        videoId.endsWith("1")
          ? { status: "available", transcript: "A sufficiently complete imported transcript." }
          : { status: "unavailable" },
    };
    const videos = demoPlaylists[0].videos.slice(0, 2).map((video) => ({
      ...video,
      transcript: undefined,
      transcriptStatus: "unavailable" as const,
    }));
    const result = await enrichVideosWithTranscripts(videos, provider, 2);
    expect(result[0]).toMatchObject({
      transcriptStatus: "available",
      transcript: "A sufficiently complete imported transcript.",
    });
    expect(result[1]).toMatchObject({ transcriptStatus: "unavailable" });
  });
});
