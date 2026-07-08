export type Citation = {
  chunk_index: number;
  text: string;
  page: number | null;
  source: string | null;
  score: number | null;
};

export type SessionCreateResponse = {
  session_id: string;
  chunk_count: number;
  filename: string;
  ready: boolean;
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

  const headers: HeadersInit = {};
  if (userApiKey?.trim()) {
    headers["X-User-Api-Key"] = userApiKey.trim();
  }

  const response = await fetch(`${API_URL}/api/v1/sessions`, {
    method: "POST",
    headers,
    body: form,
  });

  return handleResponse(response);
}

export async function askQuestion(
  sessionId: string,
  question: string,
  userApiKey?: string,
): Promise<AskResponse> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (userApiKey?.trim()) {
    headers["X-User-Api-Key"] = userApiKey.trim();
  }

  const response = await fetch(
    `${API_URL}/api/v1/sessions/${sessionId}/ask`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ question }),
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
