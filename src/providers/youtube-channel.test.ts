import { afterEach, describe, expect, it, vi } from "vitest";
import { parseYouTubeChannelInput, YouTubeChannelProvider } from "./youtube-channel";

afterEach(() => vi.unstubAllGlobals());

describe("YouTube channel input", () => {
  it("parses handles and channel URLs", () => {
    expect(parseYouTubeChannelInput("@GoogleDevelopers")).toEqual({ handle: "@GoogleDevelopers" });
    expect(parseYouTubeChannelInput("https://youtube.com/@GoogleDevelopers/videos")).toEqual({ handle: "@GoogleDevelopers" });
    expect(parseYouTubeChannelInput("https://youtube.com/channel/UC1234567890123456789012")).toEqual({ id: "UC1234567890123456789012" });
  });
});

describe("YouTube channel provider", () => {
  it("loads channel metadata and its uploads playlist", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ id: "UC1234567890123456789012", snippet: { title: "Channel" }, contentDetails: { relatedPlaylists: { uploads: "UU123" } } }] }), { status: 200 })));
    await expect(new YouTubeChannelProvider("key").getChannel("@channel")).resolves.toMatchObject({ id: "UC1234567890123456789012", uploadsPlaylistId: "UU123", title: "Channel" });
  });

  it("loads latest upload metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ snippet: { title: "Video", description: "Description" }, contentDetails: { videoId: "abcdefghijk", videoPublishedAt: "2026-06-20T10:00:00Z" } }] }), { status: 200 })));
    await expect(new YouTubeChannelProvider("key").getLatestVideos("UU123", 5)).resolves.toEqual([expect.objectContaining({ youtubeId: "abcdefghijk", title: "Video", publishedAt: "2026-06-20T10:00:00Z", transcriptStatus: "processing" })]);
  });
});
