import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth";

export default async function WatchlistLayout({ children }: { children: React.ReactNode }) {
  const { configured, claims } = await getAuthState();
  if (!configured) redirect("/login?error=auth_not_configured");
  if (!claims) redirect("/login?next=/watchlist");
  return children;
}
