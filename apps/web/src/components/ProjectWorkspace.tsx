"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiKeyToggle } from "@/components/ApiKeyToggle";
import { ChatPanel, type ChatMessage } from "@/components/ChatPanel";
import { PdfUploader } from "@/components/PdfUploader";
import {
  ApiError,
  askProjectStream,
  createProjectInvite,
  deleteProjectDocument,
  getProject,
  uploadProjectDocument,
  type DocumentInfo,
  type ProjectDetail,
} from "@/lib/api";
import {
  clearProjectChat,
  loadProjectChat,
  saveProjectChat,
} from "@/lib/projectStorage";
import { toHistoryPayload } from "@/lib/demoStorage";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type ProjectWorkspaceProps = {
  projectId: string;
  getToken: () => Promise<string | null>;
};

export function ProjectWorkspace({ projectId, getToken }: ProjectWorkspaceProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [documentFilter, setDocumentFilter] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userApiKey, setUserApiKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const askAbortRef = useRef<AbortController | null>(null);

  const canEdit = project?.role === "owner" || project?.role === "editor";
  const isOwner = project?.role === "owner";

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error("Not signed in.");
    const detail = await getProject(projectId, token);
    setProject(detail);
    setDocuments(detail.documents);
  }, [getToken, projectId]);

  useEffect(() => {
    const saved = loadProjectChat(projectId);
    if (saved) {
      setMessages(saved.messages);
      setDocumentFilter(saved.documentFilter);
    }
    setHydrated(true);
  }, [projectId]);

  useEffect(() => {
    if (!hydrated) return;
    saveProjectChat(projectId, { messages, documentFilter });
  }, [hydrated, projectId, messages, documentFilter]);

  useEffect(() => {
    void refresh().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load project.");
    });
  }, [refresh]);

  useEffect(() => {
    return () => askAbortRef.current?.abort();
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!canEdit) return;
      setError(null);
      setUploading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Not signed in.");
        const result = await uploadProjectDocument(
          projectId,
          file,
          token,
          userApiKey || undefined,
        );
        setDocuments(result.documents);
        setProject((current) =>
          current
            ? {
                ...current,
                documents: result.documents,
                chunk_count: result.chunk_count,
              }
            : current,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [canEdit, getToken, projectId, userApiKey],
  );

  const handleAsk = useCallback(
    async (question: string) => {
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
        const token = await getToken();
        if (!token) throw new Error("Not signed in.");
        await askProjectStream(
          projectId,
          question,
          {
            token,
            userApiKey: userApiKey || undefined,
            documentId: documentFilter,
            history,
            signal: controller.signal,
          },
          {
            onStatus: (phase) => patchAssistant({ status: phase }),
            onCitations: (citations) => patchAssistant({ citations }),
            onToken: (text) =>
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantId
                    ? {
                        ...message,
                        content: `${message.content}${text}`,
                        status: undefined,
                      }
                    : message,
                ),
              ),
            onDone: () => patchAssistant({ status: undefined }),
          },
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message =
          err instanceof ApiError ? err.message : "Failed to get an answer.";
        patchAssistant({ content: message, status: undefined });
        setError(message);
      } finally {
        setAsking(false);
      }
    },
    [documentFilter, getToken, messages, projectId, userApiKey],
  );

  const handleInvite = async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in.");
      const invite = await createProjectInvite(projectId, token, "viewer");
      const url = `${window.location.origin}${invite.path}`;
      setInviteUrl(url);
      await navigator.clipboard.writeText(url).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite.");
    }
  };

  const handleDeleteDoc = async (documentId: string) => {
    if (!canEdit) return;
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not signed in.");
      await deleteProjectDocument(projectId, documentId, token);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">
            {project?.name || "Project"}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Role: {project?.role || "…"} · {documents.length} document
            {documents.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOwner ? (
            <button
              type="button"
              onClick={() => void handleInvite()}
              className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-medium"
            >
              Copy invite link
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              clearProjectChat(projectId);
              setMessages([]);
            }}
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm"
          >
            Clear chat
          </button>
        </div>
      </div>

      {inviteUrl ? (
        <p className="rounded-xl bg-sand/60 px-4 py-3 text-sm text-ink/80">
          Invite link copied: <span className="break-all">{inviteUrl}</span>
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          {canEdit ? (
            <PdfUploader
              onFileSelected={handleUpload}
              disabled={uploading}
              uploading={uploading}
              hasSession={documents.length > 0}
            />
          ) : (
            <p className="text-sm text-ink/55">Viewer role — ask only.</p>
          )}
          <ApiKeyToggle value={userApiKey} onChange={setUserApiKey} />
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/45">
              Documents
            </p>
            <button
              type="button"
              onClick={() => setDocumentFilter(null)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                documentFilter === null ? "bg-teal/10 text-teal" : "text-ink/70"
              }`}
            >
              All documents
            </button>
            {documents.map((doc) => (
              <div key={doc.document_id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDocumentFilter(doc.document_id)}
                  className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm ${
                    documentFilter === doc.document_id
                      ? "bg-teal/10 text-teal"
                      : "text-ink/70"
                  }`}
                >
                  {doc.filename}
                </button>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => void handleDeleteDoc(doc.document_id)}
                    className="text-xs text-ink/40 hover:text-red-600"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <Link href="/app" className="text-sm text-teal">
            ← All projects
          </Link>
        </aside>

        <ChatPanel
          messages={messages}
          onAsk={handleAsk}
          loading={asking}
          disabled={documents.length === 0}
        />
      </div>
    </div>
  );
}
