"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiKeyToggle } from "@/components/ApiKeyToggle";
import { ChatPanel, type ChatMessage } from "@/components/ChatPanel";
import { PdfUploader } from "@/components/PdfUploader";
import {
  ApiError,
  addDocument,
  askQuestionStream,
  createSession,
  deleteSession,
  documentsFromSession,
  type DocumentInfo,
} from "@/lib/api";
import {
  clearDemoState,
  loadDemoState,
  saveDemoState,
  toHistoryPayload,
} from "@/lib/demoStorage";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DemoWorkspace() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [documentFilter, setDocumentFilter] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userApiKey, setUserApiKey] = useState("");
  const [forceKeyPrompt, setForceKeyPrompt] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sessionExpiredHint, setSessionExpiredHint] = useState(false);
  const askAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = loadDemoState();
    if (saved) {
      const docs = saved.documents ?? [];
      const sid = docs.length > 0 ? saved.sessionId : null;
      setSessionId(sid);
      setDocuments(docs);
      setMessages(saved.messages);
      setDocumentFilter(docs.length > 1 ? saved.documentFilter : null);
      if (sid && docs.length > 0) {
        setSessionExpiredHint(false);
      } else if (saved.messages.length > 0 && !sid) {
        setSessionExpiredHint(true);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDemoState({
      sessionId,
      documents,
      messages,
      documentFilter,
    });
  }, [hydrated, sessionId, documents, messages, documentFilter]);

  useEffect(() => {
    return () => {
      askAbortRef.current?.abort();
    };
  }, []);

  const handleSessionExpired = useCallback(() => {
    setSessionId(null);
    setDocuments([]);
    setDocumentFilter(null);
    setSessionExpiredHint(true);
    setError(
      "Server session expired. Re-upload your PDFs to keep asking — chat history is still here.",
    );
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          throw new Error("Only PDF files are supported.");
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("PDF exceeds the 10 MB limit.");
        }

        let keepChat = false;

        if (sessionId && documents.length > 0) {
          try {
            const result = await addDocument(
              sessionId,
              file,
              userApiKey || undefined,
            );
            setDocuments(
              result.documents?.length
                ? result.documents
                : [
                    ...documents,
                    result.document ?? {
                      document_id: result.session_id,
                      filename: file.name,
                      chunk_count: result.chunk_count,
                    },
                  ],
            );
            setSessionExpiredHint(false);
            return;
          } catch (err) {
            if (!(err instanceof ApiError && err.status === 404)) {
              throw err;
            }
            keepChat = true;
            setSessionId(null);
            setDocuments([]);
            setDocumentFilter(null);
          }
        }

        const session = await createSession(file, userApiKey || undefined);
        setSessionId(session.session_id);
        setDocuments(documentsFromSession(session));
        setDocumentFilter(null);
        setSessionExpiredHint(false);
        if (!keepChat) {
          setMessages([]);
        }
      } catch (err) {
        if (err instanceof ApiError && err.useOwnKey) {
          setForceKeyPrompt(true);
        }
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [sessionId, documents, userApiKey],
  );

  const handleAsk = useCallback(
    async (question: string) => {
      if (!sessionId) return;

      askAbortRef.current?.abort();
      const controller = new AbortController();
      askAbortRef.current = controller;

      setError(null);
      setAsking(true);

      const history = toHistoryPayload(messages);
      const userMessageId = makeId();
      const assistantId = makeId();

      setMessages((current) => [
        ...current,
        { id: userMessageId, role: "user", content: question },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          status: "retrieving",
        },
      ]);

      const patchAssistant = (patch: Partial<ChatMessage>) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, ...patch } : message,
          ),
        );
      };

      try {
        await askQuestionStream(
          sessionId,
          question,
          {
            userApiKey: userApiKey || undefined,
            documentId: documentFilter,
            history,
            signal: controller.signal,
          },
          {
            onStatus: (phase) => {
              patchAssistant({ status: phase });
            },
            onCitations: (citations) => {
              patchAssistant({ citations });
            },
            onToken: (text) => {
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId
                    ? {
                        ...message,
                        content: `${message.content}${text}`,
                        status: "generating",
                      }
                    : message,
                ),
              );
            },
            onDone: () => {
              patchAssistant({ status: null });
            },
          },
        );
        setSessionExpiredHint(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setMessages((current) =>
            current.filter(
              (message) =>
                message.id !== userMessageId && message.id !== assistantId,
            ),
          );
          return;
        }

        setMessages((current) =>
          current.filter(
            (message) =>
              message.id !== userMessageId && message.id !== assistantId,
          ),
        );

        if (err instanceof ApiError && err.status === 404) {
          handleSessionExpired();
        } else if (err instanceof ApiError && err.useOwnKey) {
          setForceKeyPrompt(true);
          setError(
            err.message ||
              "Demo limit reached. Paste your Google API key to continue.",
          );
        } else {
          setError(err instanceof Error ? err.message : "Question failed.");
        }
      } finally {
        if (askAbortRef.current === controller) {
          askAbortRef.current = null;
        }
        setAsking(false);
      }
    },
    [sessionId, userApiKey, documentFilter, messages, handleSessionExpired],
  );

  const handleClearChat = useCallback(() => {
    askAbortRef.current?.abort();
    setMessages([]);
  }, []);

  const handleNewSession = useCallback(async () => {
    askAbortRef.current?.abort();
    if (sessionId) {
      try {
        await deleteSession(sessionId);
      } catch {
        // Session may already be gone.
      }
    }
    setSessionId(null);
    setDocuments([]);
    setDocumentFilter(null);
    setMessages([]);
    setError(null);
    setSessionExpiredHint(false);
    clearDemoState();
  }, [sessionId]);

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);
  const hasDocuments = documents.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
          <div>
            <h2 className="font-display text-xl text-ink">Documents</h2>
            <p className="mt-1 text-sm text-ink/55">
              Session expires after 30 min idle. Chat stays 7 days here.
            </p>
          </div>

          <div className="mt-4">
            <PdfUploader
              uploading={uploading}
              onFileSelected={handleUpload}
              hasSession={Boolean(sessionId)}
              compact={hasDocuments}
              error={error && !hasDocuments ? error : null}
            />
          </div>

          {hasDocuments ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/45">
                Indexed · {totalChunks} chunks
              </p>
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.document_id}
                    className="rounded-xl bg-teal/10 px-3 py-2 text-sm text-ink"
                  >
                    <p className="truncate font-medium" title={doc.filename}>
                      {doc.filename}
                    </p>
                    <p className="text-ink/60">{doc.chunk_count} chunks</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {documents.length > 1 ? (
            <div className="mt-4">
              <label
                htmlFor="document-filter"
                className="text-xs font-medium uppercase tracking-wide text-ink/45"
              >
                Search scope
              </label>
              <select
                id="document-filter"
                value={documentFilter ?? ""}
                onChange={(event) =>
                  setDocumentFilter(event.target.value || null)
                }
                className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-teal/30 focus:ring-2"
              >
                <option value="">All documents</option>
                {documents.map((doc) => (
                  <option key={doc.document_id} value={doc.document_id}>
                    {doc.filename}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {sessionExpiredHint ? (
            <p className="mt-3 text-sm text-coral" role="status">
              Re-upload PDFs to restore the searchable index.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
            <button
              type="button"
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 transition hover:bg-paper disabled:opacity-40"
            >
              Clear chat
            </button>
            <button
              type="button"
              onClick={handleNewSession}
              className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 transition hover:bg-paper"
            >
              New session
            </button>
          </div>
        </div>

        <ApiKeyToggle
          value={userApiKey}
          onChange={setUserApiKey}
          forceOpen={forceKeyPrompt}
        />

        {error && hasDocuments ? (
          <p className="text-sm text-coral" role="alert">
            {error}
          </p>
        ) : null}
      </aside>

      <section className="min-h-[420px] min-w-0 lg:h-[calc(100dvh-10.5rem)]">
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
