import { describe, expect, it } from "vitest";
import { persistedWatchlistChannelSchema } from "./watchlist-persistence";

function channelWithDates(addedAt: string, publishedAt: string) {
  return {
    id: "27b91668-9da5-4fc6-a072-b310f87d772f",
    youtubeChannelId: "UCexample",
    uploadsPlaylistId: "UUexample",
    title: "Example channel",
    description: "",
    thumbnail: "",
    topic: "AI",
    addedAt,
    lastCheckedAt: addedAt,
    videos: [
      {
        youtubeId: "WBT-z_-OPhw",
        title: "Example video",
        description: "",
        publishedAt,
        thumbnail: "",
        transcriptStatus: "available" as const,
      },
    ],
  };
}

describe("persisted watchlist channel schema", () => {
  it("accepts timestamps returned by Postgres with a UTC offset", () => {
    const channel = channelWithDates("2026-06-20T10:40:53+00:00", "2026-06-10T04:39:02+00:00");
    expect(persistedWatchlistChannelSchema.parse(channel)).toEqual(channel);
  });

  it("continues to accept YouTube timestamps ending in Z", () => {
    const channel = channelWithDates("2026-06-20T10:40:53.123Z", "2026-06-10T04:39:02Z");
    expect(persistedWatchlistChannelSchema.parse(channel)).toEqual(channel);
  });
});
