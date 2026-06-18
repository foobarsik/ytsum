"use client";
import Link from "next/link";
import { ArrowRight, ListVideo, Plus } from "lucide-react";
import { usePlaylists } from "@/components/playlist-provider";

const modeNames = { inbox: "Inbox Agent", learning: "Learning Agent", research: "Research Agent" };
export default function HomePage() {
  const { playlists, ready } = usePlaylists();
  return <div className="shell py-10 sm:py-14"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="eyebrow mb-2">Knowledge workspace</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your playlists</h1><p className="muted mt-2">Decide what to watch, learn in order, and synthesize research.</p></div><Link href="/playlists/new" className="button button-primary hidden sm:inline-flex"><Plus size={17} aria-hidden="true" />Add playlist</Link></div>
    {!ready ? <div className="grid gap-4 md:grid-cols-2">{[1,2,3].map((x) => <div key={x} className="surface p-5"><div className="skeleton mb-4 h-5 w-2/3"/><div className="skeleton h-4 w-1/2"/></div>)}</div> : playlists.length === 0 ? <section className="surface py-16 text-center"><ListVideo className="mx-auto mb-4 text-slate-400" size={32}/><h2 className="text-lg font-bold">No playlists yet</h2><p className="muted mt-2 mb-5">Add a demo playlist to see the full workflow.</p><Link href="/playlists/new" className="button button-primary">Add playlist</Link></section> : <div className="grid gap-4 md:grid-cols-2">{playlists.map((playlist) => <Link key={playlist.id} href={`/playlists/${playlist.id}`} className="surface group p-5 transition-colors hover:border-violet-300"><div className="mb-5 flex items-start justify-between gap-3"><div><span className="badge badge-amber mb-3">Demo data</span><h2 className="text-lg font-bold group-hover:text-violet-700">{playlist.title}</h2></div><ArrowRight className="mt-1 text-slate-400 group-hover:text-violet-600" size={18}/></div><p className="muted mb-4 line-clamp-2 text-sm">{playlist.analysis.overview}</p><div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-100 pt-4 text-sm"><span>{playlist.videos.length} videos</span><span>{modeNames[playlist.mode]}</span><span className="font-semibold text-emerald-700">{playlist.analysis.recommended.length} recommended</span></div></Link>)}</div>}
  </div>;
}
