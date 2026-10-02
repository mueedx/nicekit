// lib/qwen.ts - Public Qwen Chat (chat.qwen.ai/s/<uuid>) reading & parsing engine.
//
//   GET https://chat.qwen.ai/api/v2/chats/share/<uuid>
// Response: { success, data: { title, chat: { history: { messages: {} } } } }
//
// `history.messages` is a *map* keyed by message id, each with `parentId` and
// `childrenIds`. The linear conversation is recovered by walking from the root
// (no parentId) down `childrenIds[0]`.
//
// The assistant turn often has an empty `content` string: its text lives in
// `content_list[]`, so both are checked.

import { docChatToMarkdown, docChatToText, type DocChat } from "./chat-export";
import { ChatLinkError } from "./chat-errors";
import { fetchShareJson } from "./chat-http";

export interface QwenMessage {
  role: "human" | "assistant";
  text: string;
}

export interface QwenChat {
  id: string;
  name: string;
  messageCount: number;
  messages: QwenMessage[];
  fetchedAt: string;
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? (value as Record<string, any>) : {};
}

/**
 * Extracts a share id from an arbitrary string.
 * Expected: https://chat.qwen.ai/s/<uuid> (query strings are ignored).
 */
export function extractQwenShareId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  const urlMatch = trimmed.match(
    /chat\.qwen\.ai\/(?:s|share)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  if (urlMatch) return urlMatch[1].toLowerCase();

  const rawMatch = trimmed.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  if (rawMatch) return trimmed.toLowerCase();

  return null;
}

/** User text first, then the assistant's `content_list` blocks. */
function messageText(message: Record<string, any>): string {
  const content = message.content;
  if (typeof content === "string" && content.trim()) return content.trim();

  const blocks = Array.isArray(message.content_list) ? message.content_list : [];
  const parts = blocks
    .map((block: any) =>
      typeof block?.content === "string" ? block.content.trim() : "",
    )
    .filter((text: string) => Boolean(text));

  return parts.join("\n\n").trim();
}

/**
 * Recovers the linear turn order from Qwen's parent/child message map.
 * Branches follow the first child, which is what the share page renders.
 */
export function extractQwenMessages(history: Record<string, any>): QwenMessage[] {
  const raw = asRecord(history.messages);
  const byId = new Map<string, Record<string, any>>();
  for (const [id, message] of Object.entries(raw)) {
    if (message && typeof message === "object") byId.set(id, message as Record<string, any>);
  }

  const root = [...byId.values()].find((m) => !m.parentId) ?? null;

  const messages: QwenMessage[] = [];
  let cursor: Record<string, any> | null = root;
  let guard = 0;

  while (cursor && guard++ < 10_000) {
    const role = cursor.role === "user" ? "human" : "assistant";
    const text = messageText(cursor);
    if (text) messages.push({ role, text });

    const children: unknown = cursor.childrenIds;
    const nextId = Array.isArray(children) && typeof children[0] === "string" ? children[0] : null;
    cursor = nextId ? byId.get(nextId) ?? null : null;
  }

  return messages;
}

export async function fetchQwenChat(id: string): Promise<QwenChat> {
  const shareUrl = `https://chat.qwen.ai/s/${id}`;
  const data = await fetchShareJson(
    `https://chat.qwen.ai/api/v2/chats/share/${encodeURIComponent(id)}`,
    {
      provider: "Qwen",
      referer: shareUrl,
      notFoundMessage:
        "This Qwen share link does not exist or has been deleted. Double-check the URL.",
    },
  );

  const root = asRecord(data);
  const payload = asRecord(root.data);

  if (root.success === false) {
    const detail = typeof root.detail === "string" ? root.detail : "";
    if (/not\s*found|does not exist|expired/i.test(detail)) {
      throw new ChatLinkError(
        "not_found",
        "This Qwen share link does not exist or has been deleted. Double-check the URL.",
      );
    }
    throw new ChatLinkError("error", detail || "Qwen could not read this share.");
  }

  if (Object.keys(payload).length === 0) {
    throw new ChatLinkError(
      "not_found",
      "This Qwen share link does not exist or has been deleted. Double-check the URL.",
    );
  }

  const messages = extractQwenMessages(asRecord(asRecord(payload.chat).history));
  if (messages.length === 0) {
    throw new ChatLinkError(
      "empty",
      "This chat is shared but contains no readable text messages (it may be empty or media-only).",
    );
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";

  return {
    id,
    name: title || "Qwen Chat",
    messageCount: messages.length,
    messages,
    fetchedAt: new Date().toISOString(),
  };
}

/** Filename-safe version of the chat name. */
export function safeQwenFileName(name: string): string {
  const clean = (name || "qwen-chat")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return clean || "qwen-chat";
}

/** Maps a parsed Qwen chat onto the shared DocChat shape. */
export function qwenToDocChat(chat: QwenChat): DocChat {
  return {
    name: chat.name,
    sourceUrl: `https://chat.qwen.ai/s/${chat.id}`,
    messageCount: chat.messageCount,
    markdownLabels: { human: "🧑 You", assistant: "🤖 Qwen" },
    plainLabels: { human: "YOU", assistant: "QWEN" },
    messages: chat.messages.map((m) => ({ role: m.role, text: m.text })),
  };
}

export function chatToMarkdown(chat: QwenChat): string {
  return docChatToMarkdown(qwenToDocChat(chat));
}

export function chatToText(chat: QwenChat): string {
  return docChatToText(qwenToDocChat(chat));
}
