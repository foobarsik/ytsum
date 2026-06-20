import { describe, expect, it } from "vitest";
import { buildWeeklyDigest } from "./watchlist";
import type { WatchlistChannel } from "./types";

describe("weekly watchlist digest", () => {
  it("includes only recent analyzed videos and new claims", () => {
    const channels: WatchlistChannel[] = [
      {
        id: "channel-1",
        youtubeChannelId: "UC123",
        uploadsPlaylistId: "UU123",
        title: "Channel",
        description: "",
        thumbnail: "",
        topic: "AI",
        addedAt: "2026-06-01T00:00:00.000Z",
        videos: [
          {
            youtubeId: "video-1",
            title: "Recent",
            description: "",
            publishedAt: "2026-06-18T00:00:00.000Z",
            thumbnail: "",
            transcriptStatus: "available",
            insight: {
              overview: "Overview",
              claims: [
                {
                  text: "A new claim",
                  kind: "factual",
                  confidence: "medium",
                  evidenceBasis: "Transcript",
                  isNew: true,
                },
                {
                  text: "Known",
                  kind: "opinion",
                  confidence: "high",
                  evidenceBasis: "Transcript",
                  isNew: false,
                },
              ],
              signals: [
                {
                  claim: "Workflow changed",
                  signalType: "workflow_shift",
                  whyItMatters: "New process",
                  whoIsAffected: ["Developers"],
                  evidenceFromVideo: "Evidence",
                  counterpoint: "Early pattern",
                  productOpportunity: "Workflow tooling",
                  confidence: "medium",
                  novelty: 4,
                  specificity: 4,
                  evidence: 3,
                  actionability: 4,
                  marketImpact: 4,
                  hypeRisk: 1,
                  score: 15,
                },
              ],
              positionChanges: [],
              marketingSignals: [],
              reasoningRisks: [],
              qualitySignals: [],
              earlySignals: [],
              warnings: [],
              generatedAt: "2026-06-18T01:00:00.000Z",
            },
          },
          {
            youtubeId: "video-old",
            title: "Old",
            description: "",
            publishedAt: "2026-05-01T00:00:00.000Z",
            thumbnail: "",
            transcriptStatus: "available",
          },
        ],
      },
    ];

    const digest = buildWeeklyDigest(channels, new Date("2026-06-20T00:00:00.000Z"));
    expect(digest.videoCount).toBe(1);
    expect(digest.processedCount).toBe(1);
    expect(digest.newClaims.map((claim) => claim.text)).toEqual(["A new claim"]);
    expect(digest.signals.map((signal) => signal.claim)).toEqual(["Workflow changed"]);
    expect(digest.productOpportunities.map((item) => item.opportunity)).toEqual([
      "Workflow tooling",
    ]);
  });
});
