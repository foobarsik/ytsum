"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Playlist } from "@/domain/types";
import { loadPlaylists, savePlaylists } from "@/data/store";

interface Store { playlists: Playlist[]; ready: boolean; upsert: (playlist: Playlist) => void; update: (id: string, fn: (playlist: Playlist) => Playlist) => void; remove: (id: string) => void; }
const PlaylistContext = createContext<Store | null>(null);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]); const [ready, setReady] = useState(false);
  // Loading browser-persisted state after hydration is an intentional external-store sync.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPlaylists(loadPlaylists()); setReady(true); }, []);
  useEffect(() => { if (ready) savePlaylists(playlists); }, [playlists, ready]);
  const upsert = useCallback((playlist: Playlist) => setPlaylists((current) => [playlist, ...current.filter((p) => p.id !== playlist.id)]), []);
  const update = useCallback((id: string, fn: (playlist: Playlist) => Playlist) => setPlaylists((current) => current.map((p) => p.id === id ? fn(p) : p)), []);
  const remove = useCallback((id: string) => setPlaylists((current) => current.filter((playlist) => playlist.id !== id)), []);
  const value = useMemo(() => ({ playlists, ready, upsert, update, remove }), [playlists, ready, upsert, update, remove]);
  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

export function usePlaylists(): Store { const value = useContext(PlaylistContext); if (!value) throw new Error("PlaylistProvider is missing"); return value; }
