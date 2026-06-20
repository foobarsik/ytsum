import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WatchlistChannel, WatchlistInsight, WatchlistVideo } from "@/domain/types";

type ChannelRow = {
  id: string;
  youtube_channel_id: string;
  uploads_playlist_id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  topic: string;
  last_checked_at: string | null;
  created_at: string;
};
type VideoRow = {
  id: string;
  channel_id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  published_at: string;
  thumbnail_url: string | null;
  transcript_status: WatchlistVideo["transcriptStatus"];
};
type InsightRow = { watchlist_video_id: string; output: WatchlistInsight };

function fail(error: { message: string } | null, operation: string): void {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

export async function loadWatchlist(supabase: SupabaseClient): Promise<WatchlistChannel[]> {
  const { data: channelData, error: channelError } = await supabase
    .from("watchlist_channels")
    .select(
      "id,youtube_channel_id,uploads_playlist_id,title,description,thumbnail_url,topic,last_checked_at,created_at",
    )
    .order("created_at", { ascending: false });
  fail(channelError, "Could not load watchlist channels");
  const channels = (channelData ?? []) as ChannelRow[];
  if (!channels.length) return [];

  const { data: videoData, error: videoError } = await supabase
    .from("watchlist_videos")
    .select(
      "id,channel_id,youtube_video_id,title,description,published_at,thumbnail_url,transcript_status",
    )
    .in(
      "channel_id",
      channels.map((channel) => channel.id),
    )
    .order("published_at", { ascending: false });
  fail(videoError, "Could not load watchlist videos");
  const videos = (videoData ?? []) as VideoRow[];

  let insights: InsightRow[] = [];
  if (videos.length) {
    const { data, error } = await supabase
      .from("watchlist_insights")
      .select("watchlist_video_id,output")
      .in(
        "watchlist_video_id",
        videos.map((video) => video.id),
      );
    fail(error, "Could not load watchlist insights");
    insights = (data ?? []) as InsightRow[];
  }

  const insightByVideo = new Map(
    insights.map((insight) => [insight.watchlist_video_id, insight.output]),
  );
  const videosByChannel = new Map<string, WatchlistVideo[]>();
  for (const video of videos) {
    const current = videosByChannel.get(video.channel_id) ?? [];
    current.push({
      youtubeId: video.youtube_video_id,
      title: video.title,
      description: video.description,
      publishedAt: video.published_at,
      thumbnail: video.thumbnail_url ?? "",
      transcriptStatus: video.transcript_status,
      ...(insightByVideo.has(video.id) ? { insight: insightByVideo.get(video.id) } : {}),
    });
    videosByChannel.set(video.channel_id, current);
  }

  return channels.map((channel) => ({
    id: channel.id,
    youtubeChannelId: channel.youtube_channel_id,
    uploadsPlaylistId: channel.uploads_playlist_id,
    title: channel.title,
    description: channel.description,
    thumbnail: channel.thumbnail_url ?? "",
    topic: channel.topic,
    addedAt: channel.created_at,
    ...(channel.last_checked_at ? { lastCheckedAt: channel.last_checked_at } : {}),
    videos: videosByChannel.get(channel.id) ?? [],
  }));
}

export async function saveWatchlistChannel(
  supabase: SupabaseClient,
  userId: string,
  channel: WatchlistChannel,
): Promise<WatchlistChannel> {
  const now = new Date().toISOString();
  const { data: channelRow, error: channelError } = await supabase
    .from("watchlist_channels")
    .upsert(
      {
        user_id: userId,
        youtube_channel_id: channel.youtubeChannelId,
        uploads_playlist_id: channel.uploadsPlaylistId,
        title: channel.title,
        description: channel.description,
        thumbnail_url: channel.thumbnail || null,
        topic: channel.topic,
        last_checked_at: channel.lastCheckedAt ?? null,
        next_check_at: new Date(Date.now() + 6 * 60 * 60 * 1_000).toISOString(),
        updated_at: now,
      },
      { onConflict: "user_id,youtube_channel_id" },
    )
    .select("id,created_at")
    .single();
  fail(channelError, "Could not save watchlist channel");
  if (!channelRow) throw new Error("Could not save watchlist channel: no row returned");

  const persistedVideos = channel.videos.length
    ? await supabase
        .from("watchlist_videos")
        .upsert(
          channel.videos.map((video) => ({
            channel_id: channelRow.id,
            youtube_video_id: video.youtubeId,
            title: video.title,
            description: video.description,
            published_at: video.publishedAt,
            thumbnail_url: video.thumbnail || null,
            transcript_status: video.transcriptStatus,
            updated_at: now,
          })),
          { onConflict: "channel_id,youtube_video_id" },
        )
        .select("id,youtube_video_id")
    : { data: [] as { id: string; youtube_video_id: string }[], error: null };
  fail(persistedVideos.error, "Could not save watchlist videos");

  const videoIdByYoutubeId = new Map(
    (persistedVideos.data ?? []).map((video: { id: string; youtube_video_id: string }) => [
      video.youtube_video_id,
      video.id,
    ]),
  );
  const insightRows = channel.videos.flatMap((video) => {
    const watchlistVideoId = videoIdByYoutubeId.get(video.youtubeId);
    return video.insight && watchlistVideoId
      ? [
          {
            user_id: userId,
            watchlist_video_id: watchlistVideoId,
            output: video.insight,
            model: video.insight.model ?? "unknown",
            created_at: video.insight.generatedAt,
          },
        ]
      : [];
  });
  if (insightRows.length) {
    const { error } = await supabase
      .from("watchlist_insights")
      .upsert(insightRows, { onConflict: "user_id,watchlist_video_id" });
    fail(error, "Could not save watchlist insights");
  }

  return { ...channel, id: channelRow.id, addedAt: channelRow.created_at };
}

export async function deleteWatchlistChannel(
  supabase: SupabaseClient,
  userId: string,
  channelId: string,
): Promise<void> {
  const { error } = await supabase
    .from("watchlist_channels")
    .delete()
    .eq("id", channelId)
    .eq("user_id", userId);
  fail(error, "Could not delete watchlist channel");
}
