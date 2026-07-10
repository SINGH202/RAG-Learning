import type { DocumentInfo } from "@/lib/api";
import type { ChatMessage } from "@/components/ChatPanel";

const STORAGE_KEY = "documind.v2";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PersistedDemoState = {
  expiresAt: number;
  sessionId: string | null;
  documents: DocumentInfo[];
  messages: ChatMessage[];
  documentFilter: string | null;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadDemoState(): PersistedDemoState | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedDemoState;
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      expiresAt: parsed.expiresAt,
      sessionId: parsed.sessionId ?? null,
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      documentFilter: parsed.documentFilter ?? null,
    };
  } catch {
    return null;
  }
}

export function saveDemoState(state: Omit<PersistedDemoState, "expiresAt">): void {
  if (!isBrowser()) return;

  const payload: PersistedDemoState = {
    ...state,
    expiresAt: Date.now() + TTL_MS,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function clearDemoState(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function toHistoryPayload(
  messages: ChatMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-4)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}
