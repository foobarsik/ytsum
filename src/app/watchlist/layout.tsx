import { redirect } from "next/navigation";
import { WatchlistProvider } from "@/components/watchlist-provider";
import { loadWatchlist } from "@/data/watchlist-supabase";
import { getAuthState } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function WatchlistLayout({ children }: { children: React.ReactNode }) {
  const { configured, claims } = await getAuthState();
  if (!configured) redirect("/login?error=auth_not_configured");
  if (!claims) redirect("/login?next=/watchlist");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?error=auth_not_configured");
  const channels = await loadWatchlist(supabase);
  return <WatchlistProvider initialChannels={channels}>{children}</WatchlistProvider>;
}
