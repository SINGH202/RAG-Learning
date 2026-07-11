import type { ChatMessage } from "@/components/ChatPanel";

const PREFIX = "documind_project_chat_v1:";

export type ProjectChatState = {
  messages: ChatMessage[];
  documentFilter: string | null;
};

export function loadProjectChat(projectId: string): ProjectChatState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${projectId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProjectChatState;
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      documentFilter: parsed.documentFilter ?? null,
    };
  } catch {
    return null;
  }
}

export function saveProjectChat(
  projectId: string,
  state: ProjectChatState,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${PREFIX}${projectId}`, JSON.stringify(state));
}

export function clearProjectChat(projectId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${PREFIX}${projectId}`);
}
