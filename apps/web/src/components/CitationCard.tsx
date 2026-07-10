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
  const sourceLabel = citation.source || `Source ${citation.chunk_index + 1}`;

  return (
    <div className="rounded-xl border border-ink/10 bg-white/80 p-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-teal" title={sourceLabel}>
            <span className="uppercase tracking-wide">
              {citation.source ? "From" : "Source"}
            </span>
            {citation.source ? ` · ${sourceLabel}` : ` ${citation.chunk_index + 1}`}
            {citation.page != null ? ` · p.${citation.page}` : ""}
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
