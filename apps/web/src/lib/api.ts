export type Citation = {
  chunk_index: number;
  text: string;
  page: number | null;
  source: string | null;
  score: number | null;
  document_id?: string | null;
};

export type DocumentInfo = {
  document_id: string;
  filename: string;
  chunk_count: number;
};

export type SessionCreateResponse = {
  session_id: string;
  chunk_count: number;
  filename: string;
  ready: boolean;
  documents?: DocumentInfo[];
};

export type DocumentAddResponse = {
  session_id: string;
  document: DocumentInfo;
  documents: DocumentInfo[];
  chunk_count: number;
};

export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AskResponse = {
  answer: string;
  citations: Citation[];
  session_id: string;
};

export type ApiErrorBody = {
  error?: string;
  message?: string;
  use_own_key?: boolean;
  detail?: string | ApiErrorBody;
};

export class ApiError extends Error {
  status: number;
  useOwnKey: boolean;

  constructor(message: string, status: number, useOwnKey = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.useOwnKey = useOwnKey;
  }
}

/** Normalize v1 (filename only) and v2 (documents[]) session payloads. */
export function documentsFromSession(session: {
  session_id: string;
  filename?: string;
  chunk_count?: number;
  documents?: DocumentInfo[] | null;
}): DocumentInfo[] {
  if (Array.isArray(session.documents) && session.documents.length > 0) {
    return session.documents;
  }

  if (session.filename) {
    return [
      {
        document_id: session.session_id,
        filename: session.filename,
        chunk_count: session.chunk_count ?? 0,
      },
    ];
  }

  return [];
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://documind-api-e32e.onrender.com";

function parseDetail(detail: unknown): { message: string; useOwnKey: boolean } {
  if (typeof detail === "string") {
    return { message: detail, useOwnKey: false };
  }

  if (detail && typeof detail === "object") {
    const body = detail as ApiErrorBody;
    return {
      message: body.message || body.error || "Request failed",
      useOwnKey: Boolean(body.use_own_key),
    };
  }

  return { message: "Request failed", useOwnKey: false };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  let message = `Request failed (${response.status})`;
  let useOwnKey = response.status === 429;

  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as ApiErrorBody;
      const parsed = parseDetail(body.detail ?? body);
      message = parsed.message;
      useOwnKey = parsed.useOwnKey || useOwnKey;
    } else if (response.status === 502 || response.status === 503) {
      message =
        "API is waking up or ran out of memory while indexing. Wait ~30s and try again.";
    }
  } catch {
    // ignore JSON parse errors
  }

  throw new ApiError(message, response.status, useOwnKey);
}

function authHeaders(userApiKey?: string): HeadersInit {
  const headers: HeadersInit = {};
  if (userApiKey?.trim()) {
    headers["X-User-Api-Key"] = userApiKey.trim();
  }
  return headers;
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/api/v1/health`, {
    cache: "no-store",
  });
  return handleResponse(response);
}

/** Fire-and-forget ping to start a Render cold start early (e.g. on "Try demo" click). */
export function pokeApiAwake(): void {
  void fetch(`${API_URL}/api/v1/health`, { cache: "no-store" }).catch(() => {
    // Ignore — demo page will retry with UI.
  });
}

export type ApiWakeProgress = {
  attempt: number;
  elapsedMs: number;
};

/**
 * Poll /health until the API responds or timeout.
 * Render free tier often needs 30–60s after idle.
 */
export async function waitForApiReady(options?: {
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
  onProgress?: (progress: ApiWakeProgress) => void;
}): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const intervalMs = options?.intervalMs ?? 2_500;
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < timeoutMs) {
    if (options?.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    attempt += 1;
    options?.onProgress?.({
      attempt,
      elapsedMs: Date.now() - started,
    });

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      if (options?.signal) {
        options.signal.addEventListener("abort", () => controller.abort(), {
          once: true,
        });
      }

      try {
        const response = await fetch(`${API_URL}/api/v1/health`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.ok) {
          await response.json().catch(() => null);
          return;
        }
      } finally {
        clearTimeout(timer);
      }
    } catch {
      // Cold start / network — keep polling.
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, intervalMs);
      options?.signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    });
  }

  throw new ApiError(
    "API is still waking up. Wait a moment and try again.",
    503,
  );
}

export async function createSession(
  file: File,
  userApiKey?: string,
): Promise<SessionCreateResponse> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_URL}/api/v1/sessions`, {
    method: "POST",
    headers: authHeaders(userApiKey),
    body: form,
  });

  const session = await handleResponse<SessionCreateResponse>(response);
  return {
    ...session,
    documents: documentsFromSession(session),
  };
}

export async function addDocument(
  sessionId: string,
  file: File,
  userApiKey?: string,
): Promise<DocumentAddResponse> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(
    `${API_URL}/api/v1/sessions/${sessionId}/documents`,
    {
      method: "POST",
      headers: authHeaders(userApiKey),
      body: form,
    },
  );

  return handleResponse(response);
}

export async function askQuestion(
  sessionId: string,
  question: string,
  options?: {
    userApiKey?: string;
    documentId?: string | null;
    history?: HistoryMessage[];
  },
): Promise<AskResponse> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...authHeaders(options?.userApiKey),
  };

  const body: {
    question: string;
    document_id?: string;
    history?: HistoryMessage[];
  } = { question };

  if (options?.documentId) {
    body.document_id = options.documentId;
  }
  if (options?.history && options.history.length > 0) {
    body.history = options.history.slice(-4);
  }

  const response = await fetch(
    `${API_URL}/api/v1/sessions/${sessionId}/ask`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
  );

  return handleResponse(response);
}

export type StreamStatusPhase = "retrieving" | "generating";

export type AskStreamHandlers = {
  onStatus?: (phase: StreamStatusPhase) => void;
  onCitations?: (citations: Citation[]) => void;
  onToken?: (text: string) => void;
  onDone?: (sessionId: string) => void;
};

function buildAskBody(
  question: string,
  options?: {
    documentId?: string | null;
    history?: HistoryMessage[];
  },
) {
  const body: {
    question: string;
    document_id?: string;
    history?: HistoryMessage[];
  } = { question };

  if (options?.documentId) {
    body.document_id = options.documentId;
  }
  if (options?.history && options.history.length > 0) {
    body.history = options.history.slice(-4);
  }
  return body;
}

export async function askQuestionStream(
  sessionId: string,
  question: string,
  options: {
    userApiKey?: string;
    documentId?: string | null;
    history?: HistoryMessage[];
    signal?: AbortSignal;
  },
  handlers: AskStreamHandlers,
): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...authHeaders(options.userApiKey),
  };

  const response = await fetch(
    `${API_URL}/api/v1/sessions/${sessionId}/ask/stream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(
        buildAskBody(question, {
          documentId: options.documentId,
          history: options.history,
        }),
      ),
      signal: options.signal,
    },
  );

  if (!response.ok) {
    await handleResponse(response);
    return;
  }

  if (!response.body) {
    throw new ApiError("Streaming response had no body", 500);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleEvent = (raw: string) => {
    const dataLine = raw
      .split("\n")
      .map((line) => line.trimEnd())
      .find((line) => line.startsWith("data:"));
    if (!dataLine) return;

    const payload = dataLine.slice(5).trim();
    if (!payload || payload === "[DONE]") return;

    let event: {
      type?: string;
      phase?: StreamStatusPhase;
      citations?: Citation[];
      text?: string;
      session_id?: string;
      message?: string;
      use_own_key?: boolean;
    };
    try {
      event = JSON.parse(payload);
    } catch {
      return;
    }

    switch (event.type) {
      case "status":
        if (event.phase === "retrieving" || event.phase === "generating") {
          handlers.onStatus?.(event.phase);
        }
        break;
      case "citations":
        handlers.onCitations?.(event.citations ?? []);
        break;
      case "token":
        if (event.text) handlers.onToken?.(event.text);
        break;
      case "done":
        handlers.onDone?.(event.session_id || sessionId);
        break;
      case "error":
        throw new ApiError(
          event.message || "Stream failed",
          event.use_own_key ? 429 : 500,
          Boolean(event.use_own_key),
        );
      case undefined:
        break;
      default: {
        const _exhaustive: string = event.type;
        void _exhaustive;
        break;
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      if (part.trim()) handleEvent(part);
    }
  }

  if (buffer.trim()) {
    handleEvent(buffer);
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/sessions/${sessionId}`, {
    method: "DELETE",
  });
  await handleResponse(response);
}

export { API_URL };
