"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath, initialError }: { nextPath: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialError ?? "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setMessage("Supabase Auth is not configured."); setBusy(false); return; }
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", nextPath);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
    });
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
    setBusy(false);
  }

  return <form onSubmit={submit} className="surface mt-7 p-5 sm:p-7"><label className="label" htmlFor="auth-email">Email address</label><input id="auth-email" className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required/><button className="button button-primary mt-4 w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={17}/> : <Mail size={17}/>}Send magic link</button>{message && <p aria-live="polite" className={`mt-4 text-sm font-semibold ${message.startsWith("Check") ? "text-[#15803D]" : "text-red-700"}`}>{message}</p>}<p className="muted mt-4 text-xs leading-5">No password required. The link is single-use and expires automatically.</p></form>;
}
