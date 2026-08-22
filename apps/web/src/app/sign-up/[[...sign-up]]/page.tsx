"use client";

import Link from "next/link";
import { SignUp, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

function safeRedirectPath(raw: string | null): string {
  if (!raw) return "/app";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/app";
}

function SignUpContent() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authUnconfigured = searchParams.get("error") === "auth_unconfigured";
  const redirectUrl = useMemo(
    () => safeRedirectPath(searchParams.get("redirect_url")),
    [searchParams],
  );

  useEffect(() => {
    if (!isLoaded || !userId || authUnconfigured) return;
    router.replace(redirectUrl);
  }, [isLoaded, userId, redirectUrl, router, authUnconfigured]);

  if (authUnconfigured) {
    return (
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-ink">Sign-up isn&apos;t ready</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">
          Server-side Clerk auth is not configured (
          <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-xs">
            CLERK_SECRET_KEY
          </code>{" "}
          missing). Add it on Vercel and redeploy, or use the public demo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/demo"
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal/90"
          >
            Open live demo
          </Link>
          <Link
            href="/"
            className="rounded-full border border-ink/15 bg-white/50 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-white"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  if (!isLoaded || userId) {
    return (
      <p className="text-sm text-ink/55" role="status">
        {userId ? "Already signed in — redirecting…" : "Loading…"}
      </p>
    );
  }

  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      fallbackRedirectUrl={redirectUrl}
      forceRedirectUrl={redirectUrl}
    />
  );
}

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <Suspense
        fallback={
          <p className="text-sm text-ink/55" role="status">
            Loading…
          </p>
        }
      >
        <SignUpContent />
      </Suspense>
    </main>
  );
}
