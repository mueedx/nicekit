// lib/grok.ts - Public Grok (grok.com/share/<token>) reading & parsing engine.
//
// grok.com's conversation REST routes require credentials, but the share-link
// route does not:
//   GET https://grok.com/rest/app-chat/share_links/<token>
// Response: { responses: [ { responseId, message, sender, createTime, ... } ] }
//
// `responses` comes back in chronological order; `sender` is "human" or
// "assistant". Grok shares carry no title, so the name is derived from the
// first human turn.

import { docChatToMarkdown, docChatToText, type DocChat } from "./chat-export";
import { ChatLinkError } from "./chat-errors";
import { fetchShareJson } from "./chat-http";

export interface GrokMessage {
  role: "human" | "assistant";
  text: string;
}

export interface GrokChat {
  id: string;
  name: string;
  messageCount: number;
  messages: GrokMessage[];
  fetchedAt: string;
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? (value as Record<string, any>) : {};
}

/**
 * Extracts a share token from an arbitrary string.
 * Expected: https://grok.com/share/<token>  (base64url("share-…") + "_" + uuid)
 */
export function extractGrokShareId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  const urlMatch = trimmed.match(/(?:^|\/\/|\.)grok\.com\/share\/([A-Za-z0-9_-]{8,256})/i);
  if (urlMatch) return urlMatch[1];

  // Raw tokens are not UUIDs and are ambiguous with other providers, so only
  // accept one when it carries Grok's characteristic "<b64>_<uuid>" shape.
  const rawMatch = trimmed.match(/^[A-Za-z0-9-]{6,120}_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  if (rawMatch) return trimmed;

  return null;
}

/** Normalizes `responses[]` into ordered user/assistant turns. */
export function extractGrokMessages(responses: unknown[]): GrokMessage[] {
  const messages: GrokMessage[] = [];

  for (const entry of responses) {
    const record = asRecord(entry);
    const role = record.sender === "human" ? "human" : "assistant";
    const text = typeof record.message === "string" ? record.message.trim() : "";
    if (text) messages.push({ role, text });
  }

  return messages;
}

/** Grok has no share title: derive one from the opening prompt. */
function deriveName(messages: GrokMessage[]): string {
  const firstPrompt = messages.find((m) => m.role === "human")?.text ?? "";
  const clipped = firstPrompt.replace(/\s+/g, " ").trim().slice(0, 60);
  return clipped || "Grok Chat";
}

export async function fetchGrokChat(id: string): Promise<GrokChat> {
  const shareUrl = `https://grok.com/share/${id}`;
  const data = await fetchShareJson(
    `https://grok.com/rest/app-chat/share_links/${encodeURIComponent(id)}`,
    {
      provider: "Grok",
      referer: shareUrl,
      notFoundMessage:
        "This Grok share link does not exist or has been deleted. Double-check the URL.",
    },
  );

  const root = asRecord(data);
  const responses = Array.isArray(root.responses) ? root.responses : [];

  if (responses.length === 0) {
    // Distinguish "unknown token" from "shared but empty".
    if (root.code !== undefined || root.message) {
      throw new ChatLinkError(
        "not_found",
        "This Grok share link does not exist or has been deleted. Double-check the URL.",
      );
    }
    throw new ChatLinkError(
      "empty",
      "This chat is shared but contains no readable text messages (it may be empty or media-only).",
    );
  }

  const messages = extractGrokMessages(responses);
  if (messages.length === 0) {
    throw new ChatLinkError(
      "empty",
      "This chat is shared but contains no readable text messages (it may be empty or media-only).",
    );
  }

  return {
    id,
    name: deriveName(messages),
    messageCount: messages.length,
    messages,
    fetchedAt: new Date().toISOString(),
  };
}

/** Filename-safe version of the chat name. */
export function safeGrokFileName(name: string): string {
  const clean = (name || "grok-chat")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return clean || "grok-chat";
}

/** Maps a parsed Grok chat onto the shared DocChat shape. */
export function grokToDocChat(chat: GrokChat): DocChat {
  return {
    name: chat.name,
    sourceUrl: `https://grok.com/share/${chat.id}`,
    messageCount: chat.messageCount,
    markdownLabels: { human: "🧑 You", assistant: "🤖 Grok" },
    plainLabels: { human: "YOU", assistant: "GROK" },
    messages: chat.messages.map((m) => ({ role: m.role, text: m.text })),
  };
}

export function chatToMarkdown(chat: GrokChat): string {
  return docChatToMarkdown(grokToDocChat(chat));
}

export function chatToText(chat: GrokChat): string {
  return docChatToText(grokToDocChat(chat));
}
