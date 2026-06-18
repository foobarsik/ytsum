import { NextResponse } from "next/server";
import { addPlaylistSchema } from "@/domain/schemas";
import { parseYouTubePlaylistUrl } from "@/domain/youtube-url";
import { mapExternalError } from "@/domain/errors";
import { YouTubeDataApiProvider } from "@/providers/youtube";
import { enrichVideosWithTranscripts, YouTubeTranscriptProvider } from "@/providers/youtube-transcript";

export async function POST(request: Request) {
  try {
    if (!process.env.YOUTUBE_API_KEY) return NextResponse.json({ error: { code: "NOT_CONFIGURED", message: "Live YouTube import is not configured. Use demo mode or add YOUTUBE_API_KEY." } }, { status: 503 });
    const input = addPlaylistSchema.parse(await request.json()); const id = parseYouTubePlaylistUrl(input.url);
    const provider = new YouTubeDataApiProvider(process.env.YOUTUBE_API_KEY, Number(process.env.MAX_VIDEOS_PER_BATCH ?? 25));
    const playlist = await provider.getPlaylist(id);
    const transcriptProvider = new YouTubeTranscriptProvider(process.env.TRANSCRIPT_LANGUAGE);
    const videos = await enrichVideosWithTranscripts(playlist.videos, transcriptProvider, Number(process.env.TRANSCRIPT_CONCURRENCY ?? 3));
    return NextResponse.json({ ...playlist, videos });
  } catch (error) { const mapped = mapExternalError(error); console.error("playlist_import_failed", { code: mapped.code }); return NextResponse.json({ error: { code: mapped.code, message: mapped.message, retryable: mapped.retryable } }, { status: mapped.code === "INVALID_PLAYLIST_URL" ? 400 : 502 }); }
}
