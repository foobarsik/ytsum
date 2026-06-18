import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BrainCircuit, Settings } from "lucide-react";
import { PlaylistProvider } from "@/components/playlist-provider";
import { PwaClient } from "@/components/pwa-client";
import "./globals.css";

export const metadata: Metadata = { title: { default: "PlaylistMind", template: "%s · PlaylistMind" }, description: "AI agents for your YouTube playlists", applicationName: "PlaylistMind", manifest: "/manifest.webmanifest", appleWebApp: { capable: true, title: "PlaylistMind", statusBarStyle: "default" }, icons: { apple: "/icons/icon-192.png" } };
export const viewport: Viewport = { themeColor: "#e11d2a", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const hasYouTube = Boolean(process.env.YOUTUBE_API_KEY);
  return <html lang="en"><body><PlaylistProvider><PwaClient /><header className="border-b border-[var(--border)] bg-white"><div className="shell flex h-16 items-center justify-between"><Link href="/" className="flex items-center gap-2 font-bold"><span className="grid size-8 place-items-center rounded-lg bg-[var(--accent)] text-white"><BrainCircuit size={18} aria-hidden="true" /></span>PlaylistMind</Link><div className="flex items-center gap-3"><span className={`badge hidden sm:inline-flex ${hasYouTube ? "badge-green" : "badge-amber"}`}>{hasYouTube ? "YouTube API" : "Demo mode"}</span><Link href="/settings" className="button button-secondary" aria-label="Settings"><Settings size={17}/><span className="hidden sm:inline">Settings</span></Link><Link href="/playlists/new" className="button button-primary">Add playlist</Link></div></div></header><main>{children}</main></PlaylistProvider></body></html>;
}
