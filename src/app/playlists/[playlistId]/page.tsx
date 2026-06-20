"use client";
import { useParams } from "next/navigation";
import { PlaylistDetail } from "@/components/playlist-detail";
import { usePlaylists } from "@/components/playlist-provider";

export default function PlaylistPage() {
  const params = useParams<{ playlistId: string }>();
  const { playlists, ready } = usePlaylists();
  if (!ready)
    return (
      <div className="shell py-12">
        <div className="skeleton h-64" />
      </div>
    );
  const playlist = playlists.find((p) => p.id === params.playlistId);
  if (!playlist)
    return (
      <div className="shell py-20 text-center">
        <h1 className="text-2xl font-bold">Playlist not found</h1>
        <p className="muted mt-2">Return to the playlist library and try again.</p>
      </div>
    );
  return <PlaylistDetail playlist={playlist} />;
}
