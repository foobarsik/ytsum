"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { WatchlistChannel } from "@/domain/types";
import { clearLocalWatchlist, loadWatchlist } from "@/data/watchlist-store";

interface WatchlistStore {
  channels: WatchlistChannel[];
  ready: boolean;
  upsert: (channel: WatchlistChannel) => Promise<WatchlistChannel>;
  update: (id: string, fn: (channel: WatchlistChannel) => WatchlistChannel) => Promise<WatchlistChannel>;
  remove: (id: string) => Promise<void>;
}

const WatchlistContext = createContext<WatchlistStore | null>(null);

export function WatchlistProvider({ children, initialChannels }: { children: React.ReactNode; initialChannels: WatchlistChannel[] }) {
  const [channels, setChannels] = useState<WatchlistChannel[]>(initialChannels);
  const channelsRef = useRef(channels);
  const setLocal = useCallback((next: WatchlistChannel[]) => {
    channelsRef.current = next;
    setChannels(next);
  }, []);
  const persist = useCallback(async (channel: WatchlistChannel) => {
    const response = await fetch("/api/watchlist", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(channel),
    });
    const result = await response.json() as { channel?: WatchlistChannel; error?: { message?: string } };
    if (!response.ok || !result.channel) throw new Error(result.error?.message ?? "Could not save the watchlist.");
    return result.channel;
  }, []);
  const upsert = useCallback(async (channel: WatchlistChannel) => {
    const persisted = await persist(channel);
    setLocal([persisted, ...channelsRef.current.filter((item) => item.id !== channel.id && item.youtubeChannelId !== channel.youtubeChannelId)]);
    return persisted;
  }, [persist, setLocal]);
  const update = useCallback(async (id: string, fn: (channel: WatchlistChannel) => WatchlistChannel) => {
    const existing = channelsRef.current.find((channel) => channel.id === id);
    if (!existing) throw new Error("Watchlist channel not found.");
    const persisted = await persist(fn(existing));
    setLocal(channelsRef.current.map((channel) => channel.id === id ? persisted : channel));
    return persisted;
  }, [persist, setLocal]);
  const remove = useCallback(async (id: string) => {
    const response = await fetch(`/api/watchlist?channelId=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json() as { error?: { message?: string } };
      throw new Error(result.error?.message ?? "Could not delete the channel.");
    }
    setLocal(channelsRef.current.filter((channel) => channel.id !== id));
  }, [setLocal]);
  useEffect(() => {
    const legacyChannels = loadWatchlist();
    if (!legacyChannels.length) return;
    void (async () => {
      try {
        let next = channelsRef.current;
        for (const legacy of legacyChannels) {
          if (next.some((channel) => channel.youtubeChannelId === legacy.youtubeChannelId)) continue;
          const persisted = await persist(legacy);
          next = [persisted, ...next];
        }
        setLocal(next);
        clearLocalWatchlist();
      } catch (error) {
        console.error("watchlist_local_migration_failed", error instanceof Error ? error.message : error);
      }
    })();
  }, [persist, setLocal]);
  const ready = true;
  const value = useMemo(() => ({ channels, ready, upsert, update, remove }), [channels, ready, upsert, update, remove]);
  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistStore {
  const value = useContext(WatchlistContext);
  if (!value) throw new Error("WatchlistProvider is missing");
  return value;
}
