import type { Playlist, Recommendation, Video } from "./types";

export function applyRecommendations(videos: Video[], recommended: Recommendation[], low: Recommendation[]): Video[] {
  const rec = new Map(recommended.map((item) => [item.videoId, item]));
  const lowMap = new Map(low.map((item) => [item.videoId, item]));
  return videos.map((video) => {
    const decision = rec.get(video.id) ?? lowMap.get(video.id);
    if (!decision) return video;
    const requestedPriority = rec.has(video.id) ? "recommended" : "low";
    const priority = requestedPriority === "low" && video.transcriptStatus === "unavailable" ? "unclear" : requestedPriority;
    return { ...video, priority, priorityReason: priority === "unclear" ? `Unclear: transcript unavailable. ${decision.reason}` : decision.reason };
  });
}

export function deduplicatePlaylists(playlists: Playlist[]): Playlist[] {
  const seen = new Set<string>();
  return playlists.filter((playlist) => !seen.has(playlist.youtubePlaylistId) && Boolean(seen.add(playlist.youtubePlaylistId)));
}
