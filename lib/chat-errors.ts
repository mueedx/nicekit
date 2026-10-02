// lib/chat-errors.ts - One machine-readable error shape shared by every chat
// provider engine (Claude, ChatGPT, DeepSeek, Qwen, Grok).

export type ChatLinkStatus =
  | "valid"
  | "invalid_url"
  | "not_found"
  | "private"
  | "empty"
  | "blocked"
  | "error";

export class ChatLinkError extends Error {
  code: ChatLinkStatus;
  constructor(code: ChatLinkStatus, message: string) {
    super(message);
    this.code = code;
    this.name = "ChatLinkError";
  }
}

/**
 * Reads the status off any provider error. Claude and ChatGPT predate this
 * shared class and throw their own `ClaudeLinkError` / `ChatGptLinkError`,
 * which carry the same `code` field.
 */
export function chatLinkErrorCode(error: unknown): ChatLinkStatus {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? (code as ChatLinkStatus) : "error";
}
