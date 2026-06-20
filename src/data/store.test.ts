import { describe, expect, it } from "vitest";
import { demoPlaylists } from "./demo";
import { removeVideoFromPlaylist } from "./store";

describe("removeVideoFromPlaylist", () => {
  it("removes the local video and its structured references", () => {
    const playlist = structuredClone(demoPlaylists[0]);
    const videoId = playlist.videos[0].id;
    playlist.questions = [
      {
        id: "question-1",
        question: "Question",
        answer: "Answer",
        sources: [{ videoId, title: playlist.videos[0].title }],
        createdAt: "2026-06-19T00:00:00Z",
      },
    ];

    const result = removeVideoFromPlaylist(playlist, videoId);

    expect(result.videos.some((video) => video.id === videoId)).toBe(false);
    expect(result.analysis.recommended.some((item) => item.videoId === videoId)).toBe(false);
    expect(result.analysis.lowPriority.some((item) => item.videoId === videoId)).toBe(false);
    expect(result.questions[0].sources).toEqual([]);
    expect(playlist.videos.some((video) => video.id === videoId)).toBe(true);
  });
});
