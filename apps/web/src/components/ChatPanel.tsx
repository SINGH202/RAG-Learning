"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Citation } from "@/lib/api";
import { CitationCard } from "@/components/CitationCard";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  status?: "retrieving" | "generating" | null;
};

type ChatPanelProps = {
  messages: ChatMessage[];
  loading?: boolean;
  disabled?: boolean;
  onAsk: (question: string) => Promise<void> | void;
};

function statusLabel(status: ChatMessage["status"]): string | null {
  if (status === "retrieving") return "Retrieving sources…";
  if (status === "generating") return "Generating…";
  return null;
}

export function ChatPanel({
  messages,
  loading = false,
  disabled = false,
  onAsk,
}: ChatPanelProps) {
  const [question, setQuestion] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, loading]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading || disabled) return;
    setQuestion("");
    await onAsk(trimmed);
  }

  return (
    <div className="flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white/70">
      <div className="shrink-0 border-b border-ink/10 px-4 py-3">
        <h2 className="font-display text-xl text-ink">Ask questions</h2>
        <p className="mt-1 text-sm text-ink/55">
          Follow-ups use the last 4 messages; answers stream with live citations.
        </p>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[240px] items-center justify-center px-4 text-center">
            <div>
              <p className="font-display text-xl text-ink">Ask about your PDFs</p>
              <p className="mt-2 text-sm text-ink/55">
                Try: “What is the main policy?” or “Compare the two documents.”
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const phase = statusLabel(message.status);
            return (
              <div
                key={message.id}
                className={[
                  "w-fit rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto max-w-[min(80%,24rem)] bg-teal text-white"
                    : "mr-auto max-w-[min(92%,36rem)] bg-paper text-ink",
                ].join(" ")}
              >
                {phase ? (
                  <p className="mb-2 flex items-center gap-2 text-xs text-ink/55">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
                    {phase}
                  </p>
                ) : null}
                {message.citations && message.citations.length > 0 ? (
                  <div className="mb-3 space-y-2">
                    {message.citations.map((citation) => (
                      <CitationCard
                        key={`${message.id}-${citation.chunk_index}`}
                        citation={citation}
                      />
                    ))}
                  </div>
                ) : null}
                {message.content ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-ink/10 bg-white/80 p-3 backdrop-blur"
      >
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={
              disabled
                ? "Upload a PDF to start asking"
                : "Ask a question about your documents"
            }
            disabled={disabled || loading}
            minLength={2}
            className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-teal/30 focus:ring-2 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || loading || question.trim().length < 2}
            className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}
