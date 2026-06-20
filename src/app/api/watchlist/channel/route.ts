import { NextResponse } from "next/server";
import { z } from "zod";
import { mapExternalError } from "@/domain/errors";
import { YouTubeChannelProvider } from "@/providers/youtube-channel";
import { getAuthState } from "@/lib/supabase/auth";

const requestSchema = z.object({
  input: z.string().min(2).max(300),
  topic: z.string().max(120).optional(),
  knownVideoIds: z.array(z.string().min(1)).max(2_000).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await getAuthState();
    if (!auth.configured) {
      return NextResponse.json(
        { error: { code: "AUTH_NOT_CONFIGURED", message: "Supabase Auth is not configured." } },
        { status: 503 },
      );
    }
    if (!auth.claims) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in to use the channel watchlist." } },
        { status: 401 },
      );
    }
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({ error: { code: "NOT_CONFIGURED", message: "YouTube API is not configured." } }, { status: 503 });
    }
    const input = requestSchema.parse(await request.json());
    const provider = new YouTubeChannelProvider(process.env.YOUTUBE_API_KEY);
    const channel = await provider.getChannel(input.input);
    const known = new Set(input.knownVideoIds ?? []);
    const videos = (await provider.getLatestVideos(channel.uploadsPlaylistId, input.limit ?? 10))
      .filter((video) => !known.has(video.youtubeId));
    return NextResponse.json({ ...channel, topic: input.topic?.trim() ?? "", videos });
  } catch (error) {
    const mapped = mapExternalError(error);
    console.error("watchlist_channel_failed", { code: mapped.code });
    return NextResponse.json({ error: { code: mapped.code, message: mapped.message, retryable: mapped.retryable } }, { status: 502 });
  }
}
