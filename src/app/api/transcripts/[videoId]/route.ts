import { NextResponse } from "next/server";
import { transcriptProviderFromEnv } from "@/providers/transcripts";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  if (!/^[\w-]{11}$/.test(videoId))
    return NextResponse.json({ error: { message: "Invalid YouTube video ID." } }, { status: 400 });
  const result = await transcriptProviderFromEnv().getTranscript(videoId);
  return NextResponse.json(result);
}
