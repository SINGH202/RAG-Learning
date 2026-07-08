"use client";

import { useCallback, useState } from "react";
import { ApiKeyToggle } from "@/components/ApiKeyToggle";
import { ChatPanel, type ChatMessage } from "@/components/ChatPanel";
import { PdfUploader } from "@/components/PdfUploader";
import { ApiError, askQuestion, createSession } from "@/lib/api";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DemoWorkspace() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [chunkCount, setChunkCount] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userApiKey, setUserApiKey] = useState("");
  const [forceKeyPrompt, setForceKeyPrompt] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setMessages([]);
      setSessionId(null);
      setFilename(null);
      setChunkCount(null);

      try {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          throw new Error("Only PDF files are supported.");
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("PDF exceeds the 10 MB limit.");
        }

        const session = await createSession(file, userApiKey || undefined);
        setSessionId(session.session_id);
        setFilename(session.filename);
        setChunkCount(session.chunk_count);
      } catch (err) {
        if (err instanceof ApiError && err.useOwnKey) {
          setForceKeyPrompt(true);
        }
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [userApiKey],
  );

  const handleAsk = useCallback(
    async (question: string) => {
      if (!sessionId) return;

      setError(null);
      setAsking(true);
      setMessages((current) => [
        ...current,
        { id: makeId(), role: "user", content: question },
      ]);

      try {
        const result = await askQuestion(
          sessionId,
          question,
          userApiKey || undefined,
        );
        setMessages((current) => [
          ...current,
          {
            id: makeId(),
            role: "assistant",
            content: result.answer,
            citations: result.citations,
          },
        ]);
      } catch (err) {
        if (err instanceof ApiError && err.useOwnKey) {
          setForceKeyPrompt(true);
          setError(
            err.message ||
              "Demo limit reached. Paste your Google API key to continue.",
          );
        } else {
          setError(err instanceof Error ? err.message : "Question failed.");
        }
        setMessages((current) => current.slice(0, -1));
      } finally {
        setAsking(false);
      }
    },
    [sessionId, userApiKey],
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
          <h2 className="font-display text-xl text-ink">1. Upload PDF</h2>
          <p className="mt-1 text-sm text-ink/55">
            Creates a temporary session (expires after 30 minutes idle).
          </p>
          <div className="mt-4">
            <PdfUploader
              uploading={uploading}
              onFileSelected={handleUpload}
              error={error && !sessionId ? error : null}
            />
          </div>
          {sessionId ? (
            <div className="mt-4 rounded-xl bg-teal/10 px-3 py-2 text-sm text-ink">
              <p className="font-medium">{filename}</p>
              <p className="text-ink/60">
                {chunkCount} chunks indexed · session ready
              </p>
            </div>
          ) : null}
        </div>

        <ApiKeyToggle
          value={userApiKey}
          onChange={setUserApiKey}
          forceOpen={forceKeyPrompt}
        />

        {error && sessionId ? (
          <p className="text-sm text-coral" role="alert">
            {error}
          </p>
        ) : null}
      </aside>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">2. Ask questions</h2>
            <p className="mt-1 text-sm text-ink/55">
              Answers are grounded in retrieved PDF chunks with citations.
            </p>
          </div>
        </div>
        <ChatPanel
          messages={messages}
          loading={asking}
          disabled={!sessionId || uploading}
          onAsk={handleAsk}
        />
      </section>
    </div>
  );
}
