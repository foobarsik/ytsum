import { createSupabaseServerClient } from "./server";

export async function getAuthState() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { configured: false, claims: null } as const;
  const { data, error } = await supabase.auth.getClaims();
  return { configured: true, claims: error ? null : (data?.claims ?? null) } as const;
}
