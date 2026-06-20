"use client";

import type { Playlist, Video } from "@/domain/types";
import { demoPlaylists } from "./demo";

const STORAGE_KEY = "playlist-mind-v1";
export function loadPlaylists(): Playlist[] {
  if (typeof window === "undefined") return demoPlaylists;
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) return structuredClone(demoPlaylists);
  try {
    return JSON.parse(value) as Playlist[];
  } catch {
    return structuredClone(demoPlaylists);
  }
}
export function savePlaylists(playlists: Playlist[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}
export function updateVideo(playlist: Playlist, videoId: string, update: Partial<Video>): Playlist {
  return {
    ...playlist,
    videos: playlist.videos.map((v) => (v.id === videoId ? { ...v, ...update } : v)),
  };
}
export function removeVideoFromPlaylist(playlist: Playlist, videoId: string): Playlist {
  return {
    ...playlist,
    videos: playlist.videos.filter((video) => video.id !== videoId),
    analysis: {
      ...playlist.analysis,
      recommended: playlist.analysis.recommended.filter((item) => item.videoId !== videoId),
      lowPriority: playlist.analysis.lowPriority.filter((item) => item.videoId !== videoId),
    },
    questions: playlist.questions.map((question) => ({
      ...question,
      sources: question.sources.filter((source) => source.videoId !== videoId),
    })),
  };
}
