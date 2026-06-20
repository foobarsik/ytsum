import { afterEach, describe, expect, it, vi } from "vitest";
import { YouTubeDataApiProvider } from "./youtube";

afterEach(() => vi.unstubAllGlobals());

describe("YouTube playlist pagination", () => {
  it("returns a cursor after a bounded page without skipping items", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ items: [{ snippet: { title: "Playlist", description: "" } }] }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            nextPageToken: "page-2",
            items: [
              {
                snippet: {
                  title: "Video",
                  channelTitle: "Channel",
                  publishedAt: "2026-01-01T00:00:00Z",
                  resourceId: { videoId: "abcdefghijk" },
                  thumbnails: {},
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await new YouTubeDataApiProvider("key", 1).getPlaylist("playlist-id");
    expect(result.nextPageToken).toBe("page-2");
    expect(result.videos.map((video) => video.youtubeId)).toEqual(["abcdefghijk"]);
    expect(String(fetchMock.mock.calls[1][0])).toContain("maxResults=1");
  });
});
