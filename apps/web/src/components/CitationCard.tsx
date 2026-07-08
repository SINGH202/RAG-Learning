"use client";

import { useState } from "react";
import type { Citation } from "@/lib/api";

type CitationCardProps = {
  citation: Citation;
};

export function CitationCard({ citation }: CitationCardProps) {
  const [open, setOpen] = useState(false);
  const preview =
    citation.text.length > 140
      ? `${citation.text.slice(0, 140)}…`
      : citation.text;

  return (
    <div className="rounded-xl border border-ink/10 bg-white/70 p-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-teal">
            Source {citation.chunk_index + 1}
            {citation.page != null ? ` · page ${citation.page}` : ""}
            {citation.score != null
              ? ` · ${(citation.score * 100).toFixed(0)}%`
              : ""}
          </p>
          <p className="mt-1 text-sm text-ink/75">
            {open ? citation.text : preview}
          </p>
        </div>
        <span className="shrink-0 text-xs text-ink/40">
          {open ? "Hide" : "Show"}
        </span>
      </button>
    </div>
  );
}
