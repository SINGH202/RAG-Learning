"use client";

import { useState } from "react";

type ApiKeyToggleProps = {
  value: string;
  onChange: (value: string) => void;
  forceOpen?: boolean;
};

export function ApiKeyToggle({
  value,
  onChange,
  forceOpen = false,
}: ApiKeyToggleProps) {
  const [open, setOpen] = useState(forceOpen || Boolean(value));
  const isOpen = open || forceOpen;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-sm font-medium text-ink">Use your Google API key</p>
          <p className="mt-1 text-xs text-ink/55">
            Optional. Used when the demo rate limit is hit. Never stored.
          </p>
        </div>
        <span className="text-xs text-teal">{isOpen ? "Hide" : "Show"}</span>
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-2">
          <input
            type="password"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste Gemini API key"
            className="w-full rounded-xl border border-ink/15 bg-paper px-3 py-2 text-sm text-ink outline-none ring-teal/30 focus:ring-2"
          />
          <p className="text-xs text-ink/45">
            Get a key at{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-teal underline-offset-2 hover:underline"
            >
              Google AI Studio
            </a>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
