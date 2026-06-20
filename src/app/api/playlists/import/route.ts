import { NextResponse } from "next/server";
import { addPlaylistSchema } from "@/domain/schemas";
import { parseYouTubePlaylistUrl } from "@/domain/youtube-url";
import { mapExternalError } from "@/domain/errors";
import { YouTubeDataApiProvider } from "@/providers/youtube";
import { enrichVideosWithTranscripts } from "@/providers/youtube-transcript";
import { transcriptProviderFromEnv } from "@/providers/transcripts";
import { z } from "zod";

const importSchema = addPlaylistSchema.extend({
  knownVideoIds: z.array(z.string().min(1)).max(5_000).optional(),
  addedAfter: z.string().datetime().optional(),
  pageToken: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    if (!process.env.YOUTUBE_API_KEY)
      return NextResponse.json(
        {
          error: {
            code: "NOT_CONFIGURED",
            message: "Live YouTube import is not configured. Use demo mode or add YOUTUBE_API_KEY.",
          },
        },
        { status: 503 },
      );
    const input = importSchema.parse(await request.json());
    const id = parseYouTubePlaylistUrl(input.url);
    const provider = new YouTubeDataApiProvider(
      process.env.YOUTUBE_API_KEY,
      Number(process.env.MAX_VIDEOS_PER_BATCH ?? 25),
    );
    const playlist = await provider.getPlaylist(id, {
      excludeVideoIds: input.knownVideoIds ? new Set(input.knownVideoIds) : undefined,
      addedAfter: input.addedAfter,
      pageToken: input.pageToken,
      allowEmpty: Boolean(input.knownVideoIds),
    });
    const transcriptProvider = transcriptProviderFromEnv();
    const videos = await enrichVideosWithTranscripts(
      playlist.videos,
      transcriptProvider,
      Number(process.env.TRANSCRIPT_CONCURRENCY ?? 3),
    );
    return NextResponse.json({ ...playlist, videos });
  } catch (error) {
    const mapped = mapExternalError(error);
    console.error("playlist_import_failed", { code: mapped.code });
    return NextResponse.json(
      { error: { code: mapped.code, message: mapped.message, retryable: mapped.retryable } },
      { status: mapped.code === "INVALID_PLAYLIST_URL" ? 400 : 502 },
    );
  }
}
