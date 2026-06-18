import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ status: "ok", mode: process.env.OPENROUTER_API_KEY && process.env.YOUTUBE_API_KEY ? "configured" : "demo", providers: { youtube: Boolean(process.env.YOUTUBE_API_KEY), ai: Boolean(process.env.OPENROUTER_API_KEY), transcript: true, supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) } }); }
