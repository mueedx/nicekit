// lib/chatgpt.ts - Public ChatGPT Share (chatgpt.com/share/...) Reading & Parsing Engine
// Designed for Next.js App Router (Node runtime)
// Ponytail principle: native fetch + stdlib parsing only. No heavy dependencies.
//
// ChatGPT has no anonymous JSON API for shares (backend-api/* returns 403), so we
// read the share route's React Router v7 "single fetch" endpoint: GET
// https://chatgpt.com/share/<id>.data returns a turbo-stream whose flat "pool"
// array we decode locally. See decodeTurboStream below.

import { docChatToMarkdown, docChatToText, type DocChat } from "./chat-export";

export interface ChatGptMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ChatGptChat {
  id: string;
  name: string;
  messageCount: number;
  messages: ChatGptMessage[];
  fetchedAt: string;
}

/** Machine-readable status for ChatGPT link validation. */
export type ChatGptLinkStatus =
  | "valid"
  | "invalid_url"
  | "not_found"
  | "private"
  | "empty"
  | "blocked"
  | "error";

export class ChatGptLinkError extends Error {
  code: ChatGptLinkStatus;
  constructor(code: ChatGptLinkStatus, message: string) {
    super(message);
    this.code = code;
    this.name = "ChatGptLinkError";
  }
}

const SHARE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Extracts a clean ChatGPT share id (a UUID) from a share URL or raw id.
 * Expected: https://chatgpt.com/share/<uuid> (legacy chat.openai.com too).
 */
export function extractChatGptShareId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  const urlMatch = trimmed.match(
    /(?:chatgpt\.com|chat\.openai\.com)\/share\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  if (urlMatch) return urlMatch[1].toLowerCase();

  const idMatch = trimmed.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
  );
  if (idMatch) return idMatch[1].toLowerCase();

  return null;
}

/* =====================================================================
   turbo-stream decoding (React Router v7 "single fetch")
   ===================================================================== */

// Sentinels the encoder uses for values that have no JSON representation.
const NEGATIVE_LITERALS: Record<number, unknown> = {
  [-5]: undefined,
  [-7]: null,
};

/**
 * Decodes a turbo-stream pool. The wire format is a flat array where an object
 * is a `{ "_<keyIndex>": <valueIndex> }` map into the pool, an array is a list
 * of pool indices, and primitives sit inline. Values are shared and can be
 * cyclic (a node points at its parent, which points back at its children), so
 * decoded values are memoized by pool index — exactly as the client decoder does.
 */
export function decodeTurboStream(pool: unknown[]): unknown {
  const cache = new Map<number, unknown>();

  function resolve(value: number): unknown {
    if (value < 0) {
      // `hasOwnProperty` distinguishes the `undefined` sentinel (-5) from a miss.
      return Object.prototype.hasOwnProperty.call(NEGATIVE_LITERALS, value)
        ? NEGATIVE_LITERALS[value]
        : null;
    }
    return decode(value);
  }

  function decode(index: number): unknown {
    if (cache.has(index)) return cache.get(index);
    const value = pool[index];

    if (Array.isArray(value)) {
      const out: unknown[] = [];
      cache.set(index, out);
      for (const item of value) out.push(typeof item === "number" ? resolve(item) : item);
      return out;
    }

    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      cache.set(index, out);
      for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
        const key = pool[Number(rawKey.slice(1))];
        if (typeof key !== "string") continue;
        out[key] = typeof rawValue === "number" ? resolve(rawValue) : rawValue;
      }
      return out;
    }

    cache.set(index, value);
    return value;
  }

  return decode(0);
}

/**
 * Parses the react-router single-fetch body into the share's loader data. The
 * first line is the JSON pool; later lines are deferred promise/error chunks we
 * do not need.
 */
export function parseShareLoaderData(body: string): Record<string, unknown> | null {
  const poolLine = body.split("\n", 1)[0].trim();
  if (!poolLine.startsWith("[")) return null;

  let pool: unknown;
  try {
    pool = JSON.parse(poolLine);
  } catch {
    return null;
  }
  if (!Array.isArray(pool)) return null;

  const root = decodeTurboStream(pool);
  if (!root || typeof root !== "object") return null;

  const routes = (root as Record<string, unknown>)["routes/share.$shareId.($action)"];
  if (!routes || typeof routes !== "object") return null;

  const data = (routes as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;

  return data as Record<string, unknown>;
}

/* =====================================================================
   Fetching & normalization
   ===================================================================== */

function looksBlocked(body: string): boolean {
  return (
    body.includes("Just a moment...") ||
    body.includes("challenges.cloudflare.com") ||
    body.includes("cf-challenge") ||
    body.trimStart().startsWith("<")
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/** Joins the text parts of a ChatGPT message's content blocks (text only). */
function contentText(content: Record<string, unknown>): string {
  if (content.content_type !== "text") return "";
  const parts = content.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => (typeof part === "string" ? part : ""))
    .filter((part) => part.trim())
    .join("\n\n")
    .trim();
}

/**
 * Walks `linear_conversation` and keeps the visible user/assistant text turns,
 * mirroring what the share page renders. Internal turns (system, tool output,
 * hidden context, thoughts) are skipped.
 */
export function extractChatGptMessages(conversation: Record<string, unknown>): ChatGptMessage[] {
  const linear = conversation.linear_conversation;
  const messages: ChatGptMessage[] = [];
  if (!Array.isArray(linear)) return messages;

  for (const node of linear) {
    const message = asRecord(asRecord(node).message);
    if (Object.keys(message).length === 0) continue;

    const metadata = asRecord(message.metadata);
    if (metadata.is_visually_hidden_from_conversation === true) continue;

    const roleValue = asRecord(message.author).role;
    const role = roleValue === "user" ? "user" : roleValue === "assistant" ? "assistant" : null;
    if (!role) continue;

    const text = contentText(asRecord(message.content));
    if (!text) continue;

    messages.push({ role, text });
  }

  return messages;
}

async function fetchChatGptChatOnce(id: string): Promise<ChatGptChat> {
  const shareUrl = `https://chatgpt.com/share/${id}`;

  const response = await fetch(`${shareUrl}.data`, {
    headers: {
      "User-Agent": SHARE_UA,
      Accept: "text/x-script, application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: shareUrl,
    },
    next: { revalidate: 300 },
  });

  const rawBody = await response.text();

  if (!response.ok) {
    if (response.status === 404) {
      throw new ChatGptLinkError(
        "not_found",
        "This ChatGPT share link does not exist or has been deleted. Double-check the URL.",
      );
    }
    if (response.status === 403 || response.status === 429 || response.status === 503) {
      throw new ChatGptLinkError(
        "blocked",
        "ChatGPT is blocking automated access right now. The link may still be valid — try again in a few seconds.",
      );
    }
    throw new ChatGptLinkError("error", `Failed to fetch the ChatGPT share: HTTP ${response.status}`);
  }

  if (looksBlocked(rawBody)) {
    throw new ChatGptLinkError(
      "blocked",
      "ChatGPT returned a challenge instead of the share data. Try again in a few seconds.",
    );
  }

  const loaderData = parseShareLoaderData(rawBody);
  if (!loaderData) {
    throw new ChatGptLinkError(
      "blocked",
      "ChatGPT returned an unexpected response. Try again in a few seconds.",
    );
  }

  const serverResponse = asRecord(loaderData.serverResponse);
  if (Object.keys(serverResponse).length === 0) {
    throw new ChatGptLinkError("error", "ChatGPT returned an unexpected share payload.");
  }

  if (serverResponse.type === "error") {
    // The share route reports the reason on `error`; `data` can carry one too.
    const raw =
      (typeof serverResponse.error === "string" && serverResponse.error) ||
      (typeof serverResponse.data === "string" && serverResponse.data) ||
      "";
    const message = raw.trim() || "This ChatGPT share is not available.";
    throw new ChatGptLinkError(
      /deleted|not found|does not exist/i.test(message) ? "not_found" : "private",
      message,
    );
  }

  const conversation = asRecord(serverResponse.data);
  if (Object.keys(conversation).length === 0) {
    throw new ChatGptLinkError("empty", "This ChatGPT share is empty.");
  }

  if (conversation.is_public === false) {
    throw new ChatGptLinkError(
      "private",
      "This chat is no longer shared publicly. The owner may have revoked access.",
    );
  }

  const messages = extractChatGptMessages(conversation);
  if (messages.length === 0) {
    throw new ChatGptLinkError(
      "empty",
      "This chat is shared but contains no readable text messages (it may be empty or media-only).",
    );
  }

  const name =
    typeof conversation.title === "string" && conversation.title.trim()
      ? conversation.title.trim()
      : "ChatGPT Chat";

  return {
    id,
    name,
    messageCount: messages.length,
    messages,
    fetchedAt: new Date().toISOString(),
  };
}


/**
 * Fetches a public ChatGPT share, retrying with backoff when the request is
 * transiently blocked (the block is intermittent).
 */
export async function fetchChatGptChat(id: string): Promise<ChatGptChat> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 800));
    }
    try {
      return await fetchChatGptChatOnce(id);
    } catch (err) {
      lastError = err as Error;
      if (!(err instanceof ChatGptLinkError) || err.code !== "blocked") throw err;
    }
  }

  throw lastError ?? new ChatGptLinkError("error", "Failed to fetch the ChatGPT share.");
}

/** Filename-safe version of the chat name. */
export function safeChatFileName(name: string): string {
  const clean = (name || "chatgpt-chat").replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "-").slice(0, 60);
  return clean || "chatgpt-chat";
}

/** Maps a parsed ChatGPT conversation onto the shared DocChat shape. */
export function chatGptToDocChat(chat: ChatGptChat): DocChat {
  return {
    name: chat.name,
    sourceUrl: `https://chatgpt.com/share/${chat.id}`,
    messageCount: chat.messageCount,
    markdownLabels: { human: "🧑 You", assistant: "🤖 ChatGPT" },
    plainLabels: { human: "YOU", assistant: "CHATGPT" },
    messages: chat.messages.map((m) => ({
      role: m.role === "user" ? ("human" as const) : ("assistant" as const),
      text: m.text,
    })),
  };
}

/** Renders the chat as GitHub-flavored Markdown. */
export function chatGptToMarkdown(chat: ChatGptChat): string {
  return docChatToMarkdown(chatGptToDocChat(chat));
}

/** Renders the chat as plain text. */
export function chatGptToText(chat: ChatGptChat): string {
  return docChatToText(chatGptToDocChat(chat));
}

