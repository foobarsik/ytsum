import { AppError } from "./errors";

export function parseYouTubePlaylistUrl(input: string): string {
  let url: URL;
  try { url = new URL(input); } catch { throw new AppError("INVALID_PLAYLIST_URL", "Enter a valid YouTube playlist URL."); }
  const host = url.hostname.replace(/^www\./, "");
  if (!["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
    throw new AppError("INVALID_PLAYLIST_URL", "This does not look like a YouTube playlist URL.");
  }
  const id = url.searchParams.get("list");
  if (!id || !/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    throw new AppError("INVALID_PLAYLIST_URL", "The URL is missing a valid playlist ID.");
  }
  return id;
}
