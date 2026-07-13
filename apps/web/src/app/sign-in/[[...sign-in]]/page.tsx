"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

function safeRedirectPath(raw: string | null): string {
  if (!raw) return "/app";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/app";
}

function SignInContent() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = useMemo(
    () => safeRedirectPath(searchParams.get("redirect_url")),
    [searchParams],
  );

  useEffect(() => {
    if (isLoaded && userId) {
      router.replace(redirectUrl);
    }
  }, [isLoaded, userId, redirectUrl, router]);

  if (!isLoaded || userId) {
    return (
      <p className="text-sm text-ink/55" role="status">
        {userId ? "Already signed in — redirecting…" : "Loading…"}
      </p>
    );
  }

  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl={redirectUrl}
      forceRedirectUrl={redirectUrl}
    />
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <Suspense
        fallback={
          <p className="text-sm text-ink/55" role="status">
            Loading…
          </p>
        }
      >
        <SignInContent />
      </Suspense>
    </main>
  );
}
