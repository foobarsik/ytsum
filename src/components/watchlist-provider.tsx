"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { WatchlistChannel } from "@/domain/types";
import { loadWatchlist, saveWatchlist } from "@/data/watchlist-store";

interface WatchlistStore {
  channels: WatchlistChannel[];
  ready: boolean;
  upsert: (channel: WatchlistChannel) => void;
  update: (id: string, fn: (channel: WatchlistChannel) => WatchlistChannel) => void;
  remove: (id: string) => void;
}

const WatchlistContext = createContext<WatchlistStore | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<WatchlistChannel[]>([]);
  const [ready, setReady] = useState(false);
  // Loading browser-persisted state after hydration is an intentional external-store sync.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setChannels(loadWatchlist()); setReady(true); }, []);
  useEffect(() => { if (ready) saveWatchlist(channels); }, [channels, ready]);
  const upsert = useCallback((channel: WatchlistChannel) => setChannels((current) => [channel, ...current.filter((item) => item.id !== channel.id)]), []);
  const update = useCallback((id: string, fn: (channel: WatchlistChannel) => WatchlistChannel) => setChannels((current) => current.map((channel) => channel.id === id ? fn(channel) : channel)), []);
  const remove = useCallback((id: string) => setChannels((current) => current.filter((channel) => channel.id !== id)), []);
  const value = useMemo(() => ({ channels, ready, upsert, update, remove }), [channels, ready, upsert, update, remove]);
  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistStore {
  const value = useContext(WatchlistContext);
  if (!value) throw new Error("WatchlistProvider is missing");
  return value;
}
