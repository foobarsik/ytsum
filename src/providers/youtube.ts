import { AppError, mapExternalError } from "@/domain/errors";
import type { Video } from "@/domain/types";
import type { YouTubeMetadataProvider, YouTubePlaylistMetadata } from "./contracts";

interface YouTubeItem { snippet?: { title?: string; description?: string; channelTitle?: string; publishedAt?: string; resourceId?: { videoId?: string }; thumbnails?: { medium?: { url?: string }; default?: { url?: string } } } }
interface YouTubeResponse { items?: YouTubeItem[]; nextPageToken?: string; error?: { message?: string } }

export class YouTubeDataApiProvider implements YouTubeMetadataProvider {
  constructor(private readonly apiKey: string, private readonly maxVideos = 50) {}

  async getPlaylist(playlistId: string, options: { excludeVideoIds?: Set<string>; allowEmpty?: boolean } = {}): Promise<YouTubePlaylistMetadata> {
    try {
      const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlists");
      playlistUrl.search = new URLSearchParams({ part: "snippet", id: playlistId, key: this.apiKey }).toString();
      const playlistResponse = await fetch(playlistUrl);
      const playlistData = await playlistResponse.json() as YouTubeResponse;
      if (!playlistResponse.ok) throw new Error(playlistData.error?.message ?? "YouTube request failed");
      const playlist = playlistData.items?.[0]?.snippet;
      if (!playlist) throw new AppError("PRIVATE_PLAYLIST", "This playlist is private or cannot be accessed.");

      const videos: Video[] = [];
      let pageToken: string | undefined;
      do {
        const itemsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
        itemsUrl.search = new URLSearchParams({ part: "snippet", playlistId, maxResults: "50", key: this.apiKey, ...(pageToken ? { pageToken } : {}) }).toString();
        const response = await fetch(itemsUrl);
        const data = await response.json() as YouTubeResponse;
        if (!response.ok) throw new Error(data.error?.message ?? "YouTube request failed");
        for (const item of data.items ?? []) {
          const snippet = item.snippet; const youtubeId = snippet?.resourceId?.videoId;
          if (!youtubeId || snippet?.title === "Deleted video" || snippet?.title === "Private video") continue;
          if (options.excludeVideoIds?.has(youtubeId)) continue;
          videos.push({ id: youtubeId, youtubeId, title: snippet?.title ?? "Untitled video", channel: snippet?.channelTitle ?? "Unknown channel", duration: "Unknown", publishedAt: snippet?.publishedAt ?? "", thumbnail: snippet?.thumbnails?.medium?.url ?? snippet?.thumbnails?.default?.url ?? "", transcriptStatus: "unavailable", priority: "unclear", priorityReason: "Transcript is not available yet." });
          if (videos.length >= this.maxVideos) break;
        }
        pageToken = data.nextPageToken;
      } while (pageToken && videos.length < this.maxVideos);
      if (!videos.length && !options.allowEmpty) throw new AppError("EMPTY_PLAYLIST", "This playlist has no accessible videos.");
      return { id: playlistId, title: playlist.title ?? "YouTube playlist", description: playlist.description ?? "", videos };
    } catch (error) { throw mapExternalError(error); }
  }
}
