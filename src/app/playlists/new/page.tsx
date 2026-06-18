"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CircleCheck, Loader2 } from "lucide-react";
import { usePlaylists } from "@/components/playlist-provider";
import { createDemoPlaylist } from "@/data/demo";
import type { AgentMode, Playlist, SummaryDepth } from "@/domain/types";
import { parseYouTubePlaylistUrl } from "@/domain/youtube-url";

interface ImportedPlaylist {
  id: string;
  title: string;
  description: string;
  videos: Playlist["videos"];
}

function createLivePlaylist(metadata: ImportedPlaylist, mode: AgentMode, depth: SummaryDepth, title?: string): Playlist {
  const captionCount = metadata.videos.filter((video) => Boolean(video.transcript)).length;
  return {
    id: `${metadata.id}-${Date.now()}`,
    youtubePlaylistId: metadata.id,
    title: title?.trim() || metadata.title,
    description: metadata.description,
    mode,
    summaryDepth: depth,
    status: "partial",
    isDemo: false,
    videos: metadata.videos,
    questions: [],
    createdAt: new Date().toISOString(),
    analysis: {
      mode,
      overview: `Live YouTube metadata imported with captions for ${captionCount} of ${metadata.videos.length} videos.`,
      recommended: [],
      lowPriority: [],
      sections: [],
      warnings: captionCount < metadata.videos.length ? ["Some videos have no accessible captions and require a manual transcript."] : [],
    },
  };
}

export default function AddPlaylistPage() {
  const router = useRouter(); const { playlists, upsert } = usePlaylists();
  const [url, setUrl] = useState(""); const [title, setTitle] = useState(""); const [mode, setMode] = useState<AgentMode>("research"); const [depth, setDepth] = useState<SummaryDepth>("normal"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      const id = parseYouTubePlaylistUrl(url);
      if (playlists.some((p) => p.youtubePlaylistId === id && !id.startsWith("PL_DEMO"))) { setError("This playlist is already in your library."); return; }
      setLoading(true);
      const response = await fetch("/api/playlists/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, title: title || undefined, mode, summaryDepth: depth }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 503 && result.error?.code === "NOT_CONFIGURED") {
          const demo = createDemoPlaylist(mode, title); demo.summaryDepth = depth; demo.youtubePlaylistId = id; upsert(demo); router.push(`/playlists/${demo.id}`); return;
        }
        throw new Error(result.error?.message ?? "Could not import this playlist.");
      }
      const playlist = createLivePlaylist(result as ImportedPlaylist, mode, depth, title);
      upsert(playlist); router.push(`/playlists/${playlist.id}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not add this playlist."); } finally { setLoading(false); }
  }
  return <div className="shell py-8 sm:py-12"><Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft size={16}/>Back to playlists</Link><div className="mx-auto max-w-2xl"><div className="mb-7"><p className="eyebrow mb-2">New source</p><h1 className="text-3xl font-bold">Add a playlist</h1><p className="muted mt-2">Import metadata and choose how the playlist should be analyzed.</p></div><div className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><CircleCheck className="mt-0.5 shrink-0" size={18}/><p><strong>Live YouTube import enabled.</strong> Metadata and available captions are loaded automatically.</p></div><form onSubmit={submit} className="surface p-5 sm:p-7" noValidate><div className="mb-5"><label className="label" htmlFor="playlist-url">YouTube playlist URL</label><input id="playlist-url" className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/playlist?list=..." aria-invalid={Boolean(error)} required/><p className="muted mt-2 text-xs">Public or unlisted playlists only.</p></div><div className="mb-5"><label className="label" htmlFor="title">Playlist name <span className="font-normal text-slate-500">(optional)</span></label><input id="title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Use title from YouTube"/></div><fieldset className="mb-5"><legend className="label">Agent mode</legend><div className="grid gap-2 sm:grid-cols-3">{([['inbox','Inbox','What is worth my time?'],['learning','Learning','What order should I follow?'],['research','Research','What holds across sources?']] as const).map(([value,label,help]) => <label key={value} className={`cursor-pointer rounded-lg border p-3 ${mode === value ? 'border-[#E11D2A] bg-red-50' : 'border-zinc-200'}`}><input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mr-2 accent-[#E11D2A]"/><strong className="text-sm">{label}</strong><span className="mt-1 block pl-5 text-xs text-slate-500">{help}</span></label>)}</div></fieldset><div className="mb-6"><label className="label" htmlFor="depth">Summary depth</label><select id="depth" className="field" value={depth} onChange={(e) => setDepth(e.target.value as SummaryDepth)}><option value="brief">Brief</option><option value="normal">Normal</option><option value="deep">Deep</option></select></div>{error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}<button className="button button-primary w-full" disabled={loading}>{loading ? <><Loader2 className="animate-spin" size={17}/>Importing playlist and captions…</> : "Import playlist"}</button></form></div></div>;
}
