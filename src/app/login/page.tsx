import { redirect } from "next/navigation";
import Image from "next/image";
import { getAuthState } from "@/lib/supabase/auth";
import { LoginForm } from "./login-form";

function safeNextPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.startsWith("/") && !candidate.startsWith("//") ? candidate : "/watchlist";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const { configured, claims } = await getAuthState();
  if (claims) redirect(nextPath);
  return (
    <div className="shell py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        <Image
          src="/signalcut.png"
          alt="Signalcut"
          width={649}
          height={121}
          priority
          className="h-9 w-auto"
        />
        <p className="eyebrow mt-6 mb-2">Private workspace</p>
        <h1 className="text-3xl font-bold">Sign in to Signalcut</h1>
        <p className="muted mt-2">Access your channel watchlist and research digest.</p>
        {configured ? (
          <LoginForm nextPath={nextPath} initialError={params.error} />
        ) : (
          <div className="surface mt-7 border-red-200 bg-red-50 p-5 text-sm text-red-800">
            Supabase Auth is not configured. Add the public Supabase URL and publishable key.
          </div>
        )}
      </div>
    </div>
  );
}
