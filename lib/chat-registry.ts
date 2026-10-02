// lib/chat-registry.ts - Server-side dispatch across every supported chat
// provider. Each adapter resolves a share id into the shared `DocChat` shape,
// so the /api/chat/[provider] routes and the DOCX/PDF writers exist exactly once.

import type { DocChat } from "./chat-export";
import { CHAT_PROVIDERS, type ChatProviderId } from "./chat-providers";
import { claudeToDocChat, extractClaudeShareId, fetchClaudeChat } from "./claude";
import { chatGptToDocChat, extractChatGptShareId, fetchChatGptChat } from "./chatgpt";
import { deepSeekToDocChat, extractDeepSeekShareId, fetchDeepSeekChat } from "./deepseek";
import { grokToDocChat, extractGrokShareId, fetchGrokChat } from "./grok";
import { qwenToDocChat, extractQwenShareId, fetchQwenChat } from "./qwen";

export interface ChatAdapter {
  id: ChatProviderId;
  /** Finds this provider's share id in a pasted link (or null if it isn't theirs). */
  extractShareId(input: string): string | null;
  /** Reads the public share and normalizes it onto the shared DocChat shape. */
  fetchDocChat(shareId: string): Promise<DocChat>;
}

export const CHAT_ADAPTERS: Record<ChatProviderId, ChatAdapter> = {
  claude: {
    id: "claude",
    extractShareId: extractClaudeShareId,
    fetchDocChat: async (id) => claudeToDocChat(await fetchClaudeChat(id)),
  },
  chatgpt: {
    id: "chatgpt",
    extractShareId: extractChatGptShareId,
    fetchDocChat: async (id) => chatGptToDocChat(await fetchChatGptChat(id)),
  },
  deepseek: {
    id: "deepseek",
    extractShareId: extractDeepSeekShareId,
    fetchDocChat: async (id) => deepSeekToDocChat(await fetchDeepSeekChat(id)),
  },
  qwen: {
    id: "qwen",
    extractShareId: extractQwenShareId,
    fetchDocChat: async (id) => qwenToDocChat(await fetchQwenChat(id)),
  },
  grok: {
    id: "grok",
    extractShareId: extractGrokShareId,
    fetchDocChat: async (id) => grokToDocChat(await fetchGrokChat(id)),
  },
};

export function isChatProviderId(value: string): value is ChatProviderId {
  return Object.prototype.hasOwnProperty.call(CHAT_ADAPTERS, value);
}

export function getChatAdapter(id: ChatProviderId): ChatAdapter {
  return CHAT_ADAPTERS[id];
}

export function getAssistantLabel(id: ChatProviderId): string {
  return CHAT_PROVIDERS.find((p) => p.id === id)?.assistantLabel ?? "Assistant";
}

/** Filename-safe version of a chat name, with a per-provider fallback. */
export function safeChatFileName(name: string, fallback: string): string {
  const clean = (name || fallback)
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return clean || fallback;
}

/** First couple of turns as plain text, shown under the read result. */
export function buildChatPreview(doc: DocChat, assistantLabel: string): string {
  return doc.messages
    .slice(0, 2)
    .map((m) => `${m.role === "human" ? "You" : assistantLabel}: ${m.text.slice(0, 400)}`)
    .join("\n\n");
}
