"use client";

import Link from "next/link";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { WakeDemoLink } from "@/components/WakeDemoLink";

type SiteHeaderProps = {
  /** Highlighted CTA on the right (home page uses Try demo). */
  showDemoCta?: boolean;
};

export function SiteHeader({ showDemoCta = false }: SiteHeaderProps) {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6">
      <Link href="/" className="font-display text-2xl tracking-tight text-ink">
        DocuMind
      </Link>
      <nav className="flex shrink-0 items-center gap-4 text-sm">
        <a
          href="https://github.com/SINGH202/RAG-Learning"
          target="_blank"
          rel="noreferrer"
          className="text-ink/70 transition hover:text-ink"
        >
          GitHub
        </a>

        {!isLoaded ? (
          <span className="h-8 w-20 animate-pulse rounded-full bg-ink/10" aria-hidden />
        ) : isSignedIn ? (
          <>
            <Link href="/app" className="text-ink/70 transition hover:text-ink">
              Projects
            </Link>
            <UserButton />
          </>
        ) : (
          <>
            <SignInButton mode="modal" forceRedirectUrl="/app">
              <button
                type="button"
                className="text-ink/70 transition hover:text-ink"
              >
                Sign in
              </button>
            </SignInButton>
            <Link href="/app" className="text-ink/70 transition hover:text-ink">
              Projects
            </Link>
          </>
        )}

        {showDemoCta ? (
          <WakeDemoLink className="rounded-full bg-ink px-4 py-2 font-medium text-paper transition hover:bg-ink/90">
            Try demo
          </WakeDemoLink>
        ) : (
          <Link href="/demo" className="text-ink/70 transition hover:text-ink">
            Demo
          </Link>
        )}
      </nav>
    </header>
  );
}
