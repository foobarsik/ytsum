import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { getAuthState } from "@/lib/supabase/auth";
import { signOut } from "@/app/auth/actions";

export async function AuthControls() {
  const { configured, claims } = await getAuthState();
  if (!configured) return null;
  if (!claims) return <Link href="/login" className="button button-secondary"><LogIn size={17}/><span className="hidden sm:inline">Sign in</span></Link>;
  const email = typeof claims.email === "string" ? claims.email : "Signed in";
  return <div className="flex items-center gap-2"><span className="muted hidden max-w-40 truncate text-xs lg:inline" title={email}>{email}</span><form action={signOut}><button className="button button-secondary" type="submit"><LogOut size={17}/><span className="hidden sm:inline">Sign out</span></button></form></div>;
}
