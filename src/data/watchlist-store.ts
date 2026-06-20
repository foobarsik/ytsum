"use client";

import type { WatchlistChannel } from "@/domain/types";

const WATCHLIST_STORAGE_KEY = "playlist-mind-watchlist-v1";

export function loadWatchlist(): WatchlistChannel[] {
  if (typeof window === "undefined") return [];
  const value = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
  if (!value) return [];
  try { return JSON.parse(value) as WatchlistChannel[]; } catch { return []; }
}

export function saveWatchlist(channels: WatchlistChannel[]): void {
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(channels));
}

export function mergeWatchlistChannel(current: WatchlistChannel | undefined, incoming: WatchlistChannel): WatchlistChannel {
  if (!current) return incoming;
  const incomingIds = new Set(incoming.videos.map((video) => video.youtubeId));
  return {
    ...current,
    ...incoming,
    topic: incoming.topic || current.topic,
    addedAt: current.addedAt,
    videos: [...incoming.videos, ...current.videos.filter((video) => !incomingIds.has(video.youtubeId))]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  };
}
