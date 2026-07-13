"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

type SoftGateModalProps = {
  open: boolean;
  onContinueAsGuest: () => void;
};

export function SoftGateModal({ open, onContinueAsGuest }: SoftGateModalProps) {
  const { isSignedIn } = useAuth();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="soft-gate-title"
        className="w-full max-w-md rounded-3xl border border-ink/10 bg-paper p-6 shadow-xl"
      >
        <h2
          id="soft-gate-title"
          className="font-display text-2xl tracking-tight text-ink"
        >
          {isSignedIn ? "Save to a project?" : "Save this work?"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          {isSignedIn
            ? "You are signed in. Open Projects to create a durable library — guest demo sessions still expire after about 30 minutes."
            : "Guest sessions expire after about 30 minutes. Sign in to keep PDFs in a durable project you can reopen anytime."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={isSignedIn ? "/app" : "/sign-in?redirect_url=/app"}
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white"
          >
            {isSignedIn ? "Go to projects" : "Sign in to save"}
          </Link>
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium text-ink"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
