import { NextResponse } from "next/server";
import { YouTubeTranscriptProvider } from "@/providers/youtube-transcript";

export async function POST(_request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  if (!/^[\w-]{11}$/.test(videoId)) return NextResponse.json({ error: { message: "Invalid YouTube video ID." } }, { status: 400 });
  const result = await new YouTubeTranscriptProvider(process.env.TRANSCRIPT_LANGUAGE).getTranscript(videoId);
  return NextResponse.json(result);
}
