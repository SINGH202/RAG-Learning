"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, waitForApiReady } from "@/lib/api";

export type ApiReadyState = "checking" | "ready" | "error";

type ApiWarmupBannerProps = {
  onReadyChange?: (ready: boolean) => void;
};

export function ApiWarmupBanner({ onReadyChange }: ApiWarmupBannerProps) {
  const [state, setState] = useState<ApiReadyState>("checking");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const retry = useCallback(() => {
    setState("checking");
    setElapsedSec(0);
    setMessage(null);
    setNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    onReadyChange?.(false);

    waitForApiReady({
      signal: controller.signal,
      onProgress: ({ elapsedMs }) => {
        setElapsedSec(Math.floor(elapsedMs / 1000));
      },
    })
      .then(() => {
        if (controller.signal.aborted) return;
        setState("ready");
        onReadyChange?.(true);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState("error");
        onReadyChange?.(false);
        setMessage(
          err instanceof ApiError
            ? err.message
            : "Could not reach the API. Retry in a moment.",
        );
      });

    return () => controller.abort();
  }, [nonce, onReadyChange]);

  if (state === "ready") {
    return (
      <div
        className="mb-4 rounded-xl border border-teal/25 bg-teal/10 px-3 py-2 text-sm text-ink/80"
        role="status"
      >
        API is ready — you can upload a PDF.
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-ink"
        role="alert"
      >
        <p>{message}</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-paper transition hover:bg-ink/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="mb-4 flex items-center gap-3 rounded-xl border border-ink/10 bg-white/70 px-3 py-2.5 text-sm text-ink/75"
      role="status"
      aria-live="polite"
    >
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      <div>
        <p className="font-medium text-ink">Waking the API…</p>
        <p className="text-xs text-ink/55">
          Render free tier cold start — usually 30–60s
          {elapsedSec > 0 ? ` (${elapsedSec}s)` : ""}. Upload unlocks when ready.
        </p>
      </div>
    </div>
  );
}
