import type { WeeklyDigest, WatchlistChannel } from "./types";

export function buildWeeklyDigest(channels: WatchlistChannel[], now = new Date()): WeeklyDigest {
  const to = now.toISOString();
  const fromDate = new Date(now);
  fromDate.setUTCDate(fromDate.getUTCDate() - 7);
  const from = fromDate.toISOString();
  const videos = channels.flatMap((channel) => channel.videos
    .filter((video) => video.publishedAt >= from && video.publishedAt <= to)
    .map((video) => ({ channel, video })));
  const processed = videos.filter(({ video }) => video.insight);

  return {
    from,
    to,
    channelCount: channels.length,
    videoCount: videos.length,
    processedCount: processed.length,
    signals: processed.flatMap(({ channel, video }) => (video.insight?.signals ?? [])
      .map((signal) => ({ ...signal, channelTitle: channel.title, videoTitle: video.title, youtubeId: video.youtubeId })))
      .sort((a, b) => b.score - a.score),
    productOpportunities: processed.flatMap(({ channel, video }) => (video.insight?.signals ?? [])
      .filter((signal) => signal.productOpportunity.trim())
      .map((signal) => ({ opportunity: signal.productOpportunity, signal: signal.claim, channelTitle: channel.title, videoTitle: video.title, youtubeId: video.youtubeId }))),
    newClaims: processed.flatMap(({ channel, video }) => (video.insight?.claims ?? [])
      .filter((claim) => claim.isNew)
      .map((claim) => ({ ...claim, channelTitle: channel.title, videoTitle: video.title, youtubeId: video.youtubeId }))),
    positionChanges: processed.flatMap(({ channel, video }) => (video.insight?.positionChanges ?? [])
      .map((change) => ({ ...change, channelTitle: channel.title, videoTitle: video.title, youtubeId: video.youtubeId }))),
    marketingSignals: processed.flatMap(({ channel, video }) => (video.insight?.marketingSignals ?? [])
      .map((signal) => ({ ...signal, channelTitle: channel.title, videoTitle: video.title, youtubeId: video.youtubeId }))),
    reasoningRisks: processed.flatMap(({ channel, video }) => (video.insight?.reasoningRisks ?? [])
      .map((signal) => ({ ...signal, channelTitle: channel.title, videoTitle: video.title, youtubeId: video.youtubeId }))),
    earlySignals: processed.flatMap(({ channel, video }) => (video.insight?.earlySignals ?? [])
      .map((signal) => ({ ...signal, channelTitle: channel.title, videoTitle: video.title, youtubeId: video.youtubeId }))),
  };
}
