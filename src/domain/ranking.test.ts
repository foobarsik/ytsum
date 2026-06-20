import { describe, expect, it } from "vitest";
import { applyRecommendations, deduplicatePlaylists } from "./ranking";
import { demoPlaylists } from "@/data/demo";
describe("playlist ranking", () => {
  it("does not label transcript-less videos low quality", () => {
    const video = {
      ...demoPlaylists[0].videos[0],
      transcript: undefined,
      transcriptStatus: "unavailable" as const,
    };
    const result = applyRecommendations(
      [video],
      [],
      [
        {
          videoId: video.id,
          label: "Low",
          reason: "Overlap",
          confidence: "low",
          evidenceBasis: "Metadata",
        },
      ],
    );
    expect(result[0].priority).toBe("unclear");
    expect(result[0].priorityReason).toContain("transcript unavailable");
  });
  it("applies transcript-grounded recommendations", () => {
    const video = demoPlaylists[0].videos[0];
    expect(
      applyRecommendations(
        [video],
        [
          {
            videoId: video.id,
            label: "Watch",
            reason: "Strong",
            confidence: "high",
            evidenceBasis: "Transcript",
          },
        ],
        [],
      )[0].priority,
    ).toBe("recommended");
  });
  it("deduplicates playlists by YouTube ID", () =>
    expect(
      deduplicatePlaylists([demoPlaylists[0], { ...demoPlaylists[0], id: "copy" }]),
    ).toHaveLength(1));
});
