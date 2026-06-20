import { AppError, mapExternalError } from "@/domain/errors";
import type { WatchlistVideo } from "@/domain/types";

interface ChannelItem {
  id?: string;
  snippet?: { title?: string; description?: string; thumbnails?: { medium?: { url?: string }; default?: { url?: string } } };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

interface PlaylistItem {
  snippet?: { title?: string; description?: string; publishedAt?: string; resourceId?: { videoId?: string }; thumbnails?: { medium?: { url?: string }; default?: { url?: string } } };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
}

interface YouTubeResponse<T> { items?: T[]; error?: { message?: string } }

export interface YouTubeChannelMetadata {
  id: string;
  uploadsPlaylistId: string;
  title: string;
  description: string;
  thumbnail: string;
}

export function parseYouTubeChannelInput(input: string): { id?: string; handle?: string } {
  const value = input.trim();
  if (/^UC[\w-]{22}$/.test(value)) return { id: value };
  if (/^@[\w.-]+$/.test(value)) return { handle: value };

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "channel" && /^UC[\w-]{22}$/.test(parts[1] ?? "")) return { id: parts[1] };
    if (parts[0]?.startsWith("@")) return { handle: parts[0] };
  } catch {
    // Validation below returns a user-facing error.
  }

  throw new AppError("INVALID_PLAYLIST_URL", "Use a YouTube channel URL, @handle, or channel ID.");
}

export class YouTubeChannelProvider {
  constructor(private readonly apiKey: string) {}

  async getChannel(input: string): Promise<YouTubeChannelMetadata> {
    try {
      const filter = parseYouTubeChannelInput(input);
      const url = new URL("https://www.googleapis.com/youtube/v3/channels");
      url.search = new URLSearchParams({
        part: "snippet,contentDetails",
        key: this.apiKey,
        ...(filter.id ? { id: filter.id } : { forHandle: filter.handle ?? "" }),
      }).toString();
      const response = await fetch(url);
      const data = await response.json() as YouTubeResponse<ChannelItem>;
      if (!response.ok) throw new Error(data.error?.message ?? "YouTube channel request failed");
      const channel = data.items?.[0];
      const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
      if (!channel?.id || !uploadsPlaylistId) throw new AppError("EMPTY_PLAYLIST", "YouTube channel was not found.");
      return {
        id: channel.id,
        uploadsPlaylistId,
        title: channel.snippet?.title ?? "YouTube channel",
        description: channel.snippet?.description ?? "",
        thumbnail: channel.snippet?.thumbnails?.medium?.url ?? channel.snippet?.thumbnails?.default?.url ?? "",
      };
    } catch (error) {
      throw mapExternalError(error);
    }
  }

  async getLatestVideos(uploadsPlaylistId: string, limit = 10): Promise<WatchlistVideo[]> {
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.search = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: String(Math.min(Math.max(limit, 1), 50)),
        key: this.apiKey,
      }).toString();
      const response = await fetch(url);
      const data = await response.json() as YouTubeResponse<PlaylistItem>;
      if (!response.ok) throw new Error(data.error?.message ?? "YouTube uploads request failed");
      return (data.items ?? []).flatMap((item) => {
        const youtubeId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
        const title = item.snippet?.title;
        if (!youtubeId || !title || title === "Deleted video" || title === "Private video") return [];
        return [{
          youtubeId,
          title,
          description: item.snippet?.description ?? "",
          publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? "",
          thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? "",
          transcriptStatus: "processing" as const,
        }];
      });
    } catch (error) {
      throw mapExternalError(error);
    }
  }
}
