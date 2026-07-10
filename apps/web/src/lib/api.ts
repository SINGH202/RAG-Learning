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

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/sessions/${sessionId}`, {
    method: "DELETE",
  });
  await handleResponse(response);
}

export { API_URL };
