"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Captions, ExternalLink, FileText, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { usePlaylists } from "@/components/playlist-provider";
import { PriorityBadge, TranscriptBadge } from "@/components/status";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { useSummaryLanguage } from "@/components/use-summary-language";
import { updateVideo } from "@/data/store";
import { summaryLanguages, type SummaryLanguage } from "@/domain/summary-languages";

export default function VideoPage() {
  const params = useParams<{ playlistId: string; videoId: string }>(); const { playlists, ready, update } = usePlaylists(); const [defaultLanguage] = useSummaryLanguage(); const [showTranscript, setShowTranscript] = useState(false); const [text, setText] = useState(""); const [busy, setBusy] = useState<"summary" | "transcript" | null>(null); const [notice, setNotice] = useState("");
  const playlist = playlists.find((p) => p.id === params.playlistId); const video = playlist?.videos.find((v) => v.id === params.videoId);
  if (!ready) return <div className="shell py-12"><div className="skeleton h-64"/></div>; if (!playlist || !video) return <div className="shell py-20 text-center"><h1 className="text-2xl font-bold">Video not found</h1></div>;
  const playlistId = playlist.id; const videoId = video.id; const youtubeVideoId = video.youtubeId; const summaryDepth = playlist.summaryDepth; const currentVideo = video; const summaryLanguage = video.summaryLanguage ?? defaultLanguage; const metadata = [video.channel, video.duration !== "Unknown" ? video.duration : "", video.publishedAt].filter(Boolean).join(" · "); const hasTranscript = Boolean(video.transcript);
  function patchVideo(fields: Parameters<typeof updateVideo>[2]) { update(playlistId, (p) => updateVideo(p, videoId, fields)); }
  function saveTranscript() { if (text.trim().length < 30) { setNotice("Add at least 30 characters of transcript text."); return; } patchVideo({ transcript: text.trim(), transcriptStatus: "manually_added", priority: "unclear", priorityReason: "Transcript added. Run playlist analysis to calculate priority." }); setShowTranscript(false); setNotice("Transcript saved. It is now available for summary and analysis."); }
  async function loadTranscript() {
    setBusy("transcript"); setNotice("");
    try {
      const response = await fetch(`/api/transcripts/${youtubeVideoId}`, { method: "POST" });
      const result = await response.json() as { status?: "available" | "unavailable" | "failed"; transcript?: string; error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? "Could not fetch captions.");
      if (result.status === "available" && result.transcript) {
        patchVideo({ transcript: result.transcript, transcriptStatus: "available", priority: "unclear", priorityReason: "Transcript imported. Run playlist analysis to calculate priority." });
        setNotice("YouTube captions imported. The video is ready for summary and analysis.");
      } else {
        patchVideo({ transcriptStatus: result.status ?? "failed", priorityReason: result.status === "unavailable" ? "No captions are available. Add a transcript manually." : "Transcript import failed. Retry it or add one manually." });
        setNotice(result.status === "unavailable" ? "No captions are available for this video." : "Caption import failed. You can retry or add a transcript manually.");
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not fetch captions."); }
    finally { setBusy(null); }
  }
  async function summarize() {
    if (!hasTranscript) { await loadTranscript(); return; }
    setBusy("summary"); setNotice("");
    try {
      const response = await fetch("/api/ai/summarize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ video: currentVideo, depth: summaryDepth, language: summaryLanguage }) });
      const result = await response.json() as { summary?: string; keyPoints?: string[]; actionItems?: string[]; error?: { message?: string } };
      if (!response.ok || !result.summary || !result.keyPoints) throw new Error(result.error?.message ?? "Could not generate the summary.");
      patchVideo({ summary: result.summary, keyPoints: result.keyPoints, actionItems: result.actionItems ?? [] });
      setNotice("Summary generated through OpenRouter from the available transcript.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not generate the summary."); }
    finally { setBusy(null); }
  }
  return <div className="shell py-8 sm:py-10"><Link href={`/playlists/${playlist.id}`} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-stone-600"><ArrowLeft size={16}/>Back to playlist</Link><div className="grid gap-7 lg:grid-cols-[minmax(0,1.5fr)_360px]"><main><div className="mb-4"><YouTubeEmbed videoId={video.youtubeId} title={video.title}/></div><div className="mb-5 flex items-center justify-end gap-3"><label htmlFor="video-summary-language" className="text-sm font-semibold">Summary language</label><select id="video-summary-language" className="field min-h-0 w-auto py-2" value={summaryLanguage} onChange={(event) => { patchVideo({ summaryLanguage: event.target.value as SummaryLanguage }); setNotice("Summary language changed. Click Summarize to regenerate it."); }}>{summaryLanguages.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}</select></div><div className="mb-5 flex flex-wrap gap-2"><PriorityBadge priority={video.priority}/><TranscriptBadge status={video.transcriptStatus}/></div><h1 className="text-2xl font-bold leading-tight sm:text-3xl">{video.title}</h1><p className="muted mt-2">{metadata}</p><div className="mt-5 flex flex-wrap gap-2"><button className="button button-primary" onClick={summarize} disabled={Boolean(busy)}>{busy === "summary" ? <Loader2 className="animate-spin" size={16}/> : <FileText size={16}/>}Summarize</button>{!hasTranscript && <button className="button button-secondary" onClick={loadTranscript} disabled={Boolean(busy)}>{busy === "transcript" ? <Loader2 className="animate-spin" size={16}/> : <Captions size={16}/>}Fetch captions</button>}<button className="button button-secondary" onClick={() => { setShowTranscript(!showTranscript); setText(video.transcript ?? ""); }}><Save size={16}/>{hasTranscript ? "Edit transcript" : "Add transcript"}</button><a className="button button-secondary" href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noreferrer">Open in YouTube<ExternalLink size={15}/></a><button className="button button-secondary" onClick={() => { patchVideo({ priority: "low", priorityReason: "Marked as low value by you." }); setNotice("Video marked as low value."); }}>Mark as low value</button></div><p aria-live="polite" className={`mt-3 text-sm font-medium ${notice.includes("failed") || notice.startsWith("No captions") || notice.includes("Could not") || notice.includes("at least") ? "text-red-700" : "text-[#15803D]"}`}>{notice}</p>{showTranscript && <section className="surface mt-5 p-5"><label htmlFor="transcript" className="label">Manual transcript</label><p className="muted mb-3 text-sm">Paste source text you are authorized to use. Timestamps are shown only if present in this text.</p><textarea id="transcript" className="field min-h-48 resize-y" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste transcript…"/><div className="mt-3 flex gap-2"><button className="button button-primary" onClick={saveTranscript}>Save transcript</button><button className="button button-secondary" onClick={() => setShowTranscript(false)}>Cancel</button></div></section>}
      {video.summary ? <section className="mt-8"><p className="eyebrow mb-2">Transcript-grounded</p><h2 className="text-xl font-bold">Summary</h2><p className="mt-3 leading-7 text-stone-700">{video.summary}</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="surface p-5"><h3 className="mb-3 font-bold">Key points</h3><ul className="space-y-2 text-sm text-stone-700">{video.keyPoints?.map((p) => <li key={p}>• {p}</li>)}</ul></div><div className="surface p-5"><h3 className="mb-3 font-bold">Action items</h3><ul className="space-y-2 text-sm text-stone-700">{video.actionItems?.map((p) => <li key={p}>• {p}</li>)}</ul></div></div></section> : <section className="surface mt-8 p-8 text-center"><FileText className="mx-auto mb-3 text-stone-400"/><h2 className="font-bold">No summary yet</h2><p className="muted mt-1 text-sm">A full transcript is required. Title and description alone are not used as a video summary.</p></section>}</main><aside><div className="surface sticky top-5 p-5"><p className="eyebrow mb-2">Agent decision</p><h2 className="font-bold">Why this priority?</h2><p className="mt-3 text-sm leading-6 text-stone-700">{video.priorityReason}</p><hr className="my-5 border-stone-200"/><h3 className="font-bold">Evidence basis</h3><p className="muted mt-2 text-sm">{video.transcript ? `${video.transcriptStatus === "manually_added" ? "Manually added" : "YouTube"} transcript, ready for playlist analysis.` : "Metadata only. Quality is intentionally not assessed."}</p></div></aside></div></div>;
}
