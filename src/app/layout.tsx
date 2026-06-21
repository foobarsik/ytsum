import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Image from "next/image";
import { Eye, Settings } from "lucide-react";
import { PlaylistProvider } from "@/components/playlist-provider";
import { PwaClient } from "@/components/pwa-client";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Signalcut", template: "%s · Signalcut" },
  description: "AI agents for your YouTube playlists",
  applicationName: "Signalcut",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Signalcut", statusBarStyle: "default" },
  icons: { apple: "/icons/icon-192.png" },
};
export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const hasYouTubeApi = Boolean(process.env.YOUTUBE_API_KEY);

  return (
    <html lang="en">
      <body>
        <PlaylistProvider>
          <PwaClient />
          <header className="border-b border-[var(--border)] bg-white">
            <div className="shell flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center" aria-label="Signalcut home">
                <Image
                  src="/signalcutlogo.png"
                  alt="Signalcut"
                  width={130}
                  height={102}
                  priority
                  className="h-7 w-auto sm:hidden"
                />
                <Image
                  src="/signalcut.png"
                  alt="Signalcut"
                  width={649}
                  height={121}
                  priority
                  className="hidden h-7 w-auto sm:block"
                />
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                {!hasYouTubeApi && (
                  <span className="badge badge-amber hidden sm:inline-flex">Demo</span>
                )}
                <Link href="/watchlist" className="button button-secondary">
                  <Eye size={17} />
                  <span className="hidden sm:inline">Watchlist</span>
                </Link>
                <Link href="/settings" className="button button-secondary" aria-label="Settings">
                  <Settings size={17} />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
                <Link href="/playlists/new" className="button button-primary">
                  Add playlist
                </Link>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </PlaylistProvider>
      </body>
    </html>
  );
}
