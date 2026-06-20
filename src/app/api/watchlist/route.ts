import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteWatchlistChannel, saveWatchlistChannel } from "@/data/watchlist-supabase";
import { persistedWatchlistChannelSchema } from "@/domain/watchlist-persistence";
import { getAuthState } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function authenticatedContext() {
  const { configured, claims } = await getAuthState();
  const supabase = await createSupabaseServerClient();
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  return { configured, supabase, userId };
}

export async function PUT(request: Request) {
  try {
    const { configured, supabase, userId } = await authenticatedContext();
    if (!configured || !supabase) return NextResponse.json({ error: { message: "Supabase is not configured." } }, { status: 503 });
    if (!userId) return NextResponse.json({ error: { message: "Sign in to save the watchlist." } }, { status: 401 });
    const channel = persistedWatchlistChannelSchema.parse(await request.json());
    return NextResponse.json({ channel: await saveWatchlistChannel(supabase, userId, channel) });
  } catch (error) {
    console.error("watchlist_save_failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: { message: error instanceof Error ? error.message : "Could not save the watchlist." } }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { configured, supabase, userId } = await authenticatedContext();
    if (!configured || !supabase) return NextResponse.json({ error: { message: "Supabase is not configured." } }, { status: 503 });
    if (!userId) return NextResponse.json({ error: { message: "Sign in to update the watchlist." } }, { status: 401 });
    const channelId = z.string().uuid().parse(new URL(request.url).searchParams.get("channelId"));
    await deleteWatchlistChannel(supabase, userId, channelId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("watchlist_delete_failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: { message: error instanceof Error ? error.message : "Could not delete the channel." } }, { status: 400 });
  }
}
