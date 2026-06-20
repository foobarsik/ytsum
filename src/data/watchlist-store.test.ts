import { describe, expect, it } from "vitest";
import { mergeWatchlistChannel } from "./watchlist-store";
import type { WatchlistChannel } from "@/domain/types";

describe("watchlist channel merge", () => {
  it("places new videos first and preserves existing analysis", () => {
    const base = { id: "UC1", youtubeChannelId: "UC1", uploadsPlaylistId: "UU1", title: "Channel", description: "", thumbnail: "", topic: "AI", addedAt: "2026-01-01", videos: [] } satisfies WatchlistChannel;
    const current = { ...base, videos: [{ youtubeId: "old", title: "Old", description: "", publishedAt: "2026-06-01", thumbnail: "", transcriptStatus: "available" as const, insight: { overview: "Saved", claims: [], positionChanges: [], marketingSignals: [], reasoningRisks: [], qualitySignals: [], earlySignals: [], warnings: [], generatedAt: "2026-06-01" } }] };
    const incoming = { ...base, lastCheckedAt: "2026-06-20", videos: [{ youtubeId: "new", title: "New", description: "", publishedAt: "2026-06-20", thumbnail: "", transcriptStatus: "unavailable" as const }] };
    const merged = mergeWatchlistChannel(current, incoming);
    expect(merged.videos.map((video) => video.youtubeId)).toEqual(["new", "old"]);
    expect(merged.videos[1].insight?.overview).toBe("Saved");
  });
});
