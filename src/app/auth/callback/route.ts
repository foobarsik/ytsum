import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/watchlist";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeNextPath(url.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();
  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(nextPath, url.origin));
  }
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("error", "The sign-in link is invalid or has expired.");
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}
