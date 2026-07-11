"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { acceptInvite } from "@/lib/api";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(`/sign-in?redirect_url=/invite/${params.token}`);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Not signed in.");
        const result = await acceptInvite(params.token, token);
        if (!cancelled) {
          router.replace(`/app/projects/${result.project_id}`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Invite failed.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, params.token, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-ink">Joining project…</h1>
        {error ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : (
          <p className="mt-4 text-sm text-ink/60">Accepting invite link.</p>
        )}
      </div>
    </main>
  );
}
