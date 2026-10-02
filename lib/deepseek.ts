// lib/deepseek.ts - Public DeepSeek Chat (chat.deepseek.com/share/...) engine.
//
// DeepSeek's share HTML page sits behind an AWS WAF challenge, but the JSON
// endpoint that page calls is reachable server-side:
//   GET https://chat.deepseek.com/api/v0/share/content?share_id=<id>
// Response: { code, msg, data: { biz_data: { title, messages: [...] } } }
//
// Each message carries `role` ("USER" | "ASSISTANT") and a `fragments` array
// where REQUEST holds the user's prompt and RESPONSE holds the model's reply.
// Older shares put plain text in `content`; both shapes are accepted.

import { docChatToMarkdown, docChatToText, type DocChat } from "./chat-export";
import { ChatLinkError } from "./chat-errors";
import { fetchShareJson } from "./chat-http";

export interface DeepSeekMessage {
  role: "human" | "assistant";
  text: string;
}

export interface DeepSeekChat {
  id: string;
  name: string;
  messageCount: number;
  messages: DeepSeekMessage[];
  fetchedAt: string;
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? (value as Record<string, any>) : {};
}

/**
 * Extracts a share id from an arbitrary string.
 * Expected: https://chat.deepseek.com/share/<id>  (a short opaque token)
 */
export function extractDeepSeekShareId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  const urlMatch = trimmed.match(/chat\.deepseek\.com\/share\/([A-Za-z0-9_-]{6,64})/i);
  if (urlMatch) return urlMatch[1];

  if (/^[A-Za-z0-9_-]{10,64}$/.test(trimmed)) return trimmed;

  return null;
}

/** Pulls the readable text out of one raw DeepSeek message. */
function fragmentText(message: Record<string, any>): string {
  const fragments = Array.isArray(message.fragments) ? message.fragments : [];
  const parts = fragments
    .map((fragment: any) =>
      typeof fragment?.content === "string" ? fragment.content.trim() : "",
    )
    .filter((text: string) => Boolean(text));

  if (parts.length > 0) return parts.join("\n\n");

  // Legacy / alternate shape: a plain content string on the message itself.
  const content = message.content;
  return typeof content === "string" ? content.trim() : "";
}

/** Normalizes `biz_data.messages` into ordered user/assistant turns. */
export function extractDeepSeekMessages(bizData: Record<string, any>): DeepSeekMessage[] {
  const raw = Array.isArray(bizData.messages) ? bizData.messages : [];
  const messages: DeepSeekMessage[] = [];

  for (const message of raw) {
    if (!message || typeof message !== "object") continue;
    const role = message.role === "USER" ? "human" : "assistant";
    const text = fragmentText(message);
    if (text) messages.push({ role, text });
  }

  return messages;
}

/**
 * DeepSeek titles many shares "Shared Conversation", which makes a useless
 * filename, so fall back to the first user turn.
 */
function deriveName(title: unknown, messages: DeepSeekMessage[]): string {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";
  if (trimmedTitle && !/^shared\s+conversation$/i.test(trimmedTitle)) return trimmedTitle;

  const firstPrompt = messages.find((m) => m.role === "human")?.text ?? "";
  const clipped = firstPrompt.replace(/\s+/g, " ").trim().slice(0, 60);
  return clipped || "DeepSeek Chat";
}

export async function fetchDeepSeekChat(id: string): Promise<DeepSeekChat> {
  const shareUrl = `https://chat.deepseek.com/share/${id}`;
  const data = await fetchShareJson(
    `https://chat.deepseek.com/api/v0/share/content?share_id=${encodeURIComponent(id)}`,
    {
      provider: "DeepSeek",
      referer: shareUrl,
      notFoundMessage:
        "This DeepSeek share link does not exist or has been deleted. Double-check the URL.",
    },
  );

  const root = asRecord(data);
  const payload = asRecord(root.data);
  const bizData = asRecord(payload.biz_data);

  if (root.code !== undefined && root.code !== 0) {
    const msg = typeof root.msg === "string" ? root.msg : "";
    if (/not\s*found|does not exist|invalid/i.test(msg)) {
      throw new ChatLinkError(
        "not_found",
        "This DeepSeek share link does not exist or has been deleted. Double-check the URL.",
      );
    }
    throw new ChatLinkError("error", msg || "DeepSeek could not read this share.");
  }

  if (Object.keys(payload).length === 0) {
    throw new ChatLinkError(
      "not_found",
      "This DeepSeek share link does not exist or has been deleted. Double-check the URL.",
    );
  }

  const messages = extractDeepSeekMessages(bizData);
  if (messages.length === 0) {
    throw new ChatLinkError(
      "empty",
      "This chat is shared but contains no readable text messages (it may be empty or media-only).",
    );
  }

  return {
    id,
    name: deriveName(bizData.title, messages),
    messageCount: messages.length,
    messages,
    fetchedAt: new Date().toISOString(),
  };
}

/** Filename-safe version of the chat name. */
export function safeDeepSeekFileName(name: string): string {
  const clean = (name || "deepseek-chat")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return clean || "deepseek-chat";
}

/** Maps a parsed DeepSeek chat onto the shared DocChat shape. */
export function deepSeekToDocChat(chat: DeepSeekChat): DocChat {
  return {
    name: chat.name,
    sourceUrl: `https://chat.deepseek.com/share/${chat.id}`,
    messageCount: chat.messageCount,
    markdownLabels: { human: "🧑 You", assistant: "🤖 DeepSeek" },
    plainLabels: { human: "YOU", assistant: "DEEPSEEK" },
    messages: chat.messages.map((m) => ({ role: m.role, text: m.text })),
  };
}

export function chatToMarkdown(chat: DeepSeekChat): string {
  return docChatToMarkdown(deepSeekToDocChat(chat));
}

export function chatToText(chat: DeepSeekChat): string {
  return docChatToText(deepSeekToDocChat(chat));
}
