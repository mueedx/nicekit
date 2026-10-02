// lib/chat-providers.ts - Provider metadata shared by the client (auto-detect,
// the "which chats are supported" list) and the server (dispatch).
//
// Deliberately pure: no fetch, no engine imports, no Node APIs. This is the
// only chat module allowed into the browser bundle.

export const CHAT_PROVIDER_IDS = [
  "claude",
  "chatgpt",
  "deepseek",
  "qwen",
  "grok",
] as const;

export type ChatProviderId = (typeof CHAT_PROVIDER_IDS)[number];

export type ChatProviderMeta = {
  id: ChatProviderId;
  /** Display name shown on tiles, chips and headings. */
  label: string;
  /** Speaker label used in exports, e.g. "🤖 Claude". */
  assistantLabel: string;
  /** Hostnames that can carry this provider's share links. */
  hosts: string[];
  /** Captures the share id from the URL path. */
  sharePathRe: RegExp;
  placeholder: string;
  example: string;
};

export const CHAT_PROVIDERS: ChatProviderMeta[] = [
  {
    id: "claude",
    label: "Claude",
    assistantLabel: "Claude",
    hosts: ["claude.ai"],
    sharePathRe: /^\/share\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    placeholder: "https://claude.ai/share/...",
    example: "https://claude.ai/share/8f2c1a9e-0000-4000-8000-000000000000",
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    assistantLabel: "ChatGPT",
    hosts: ["chatgpt.com", "chat.openai.com"],
    sharePathRe: /^\/share\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    placeholder: "https://chatgpt.com/share/...",
    example: "https://chatgpt.com/share/6abe8898-fff8-83ee-8574-0d88ee55995c",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    assistantLabel: "DeepSeek",
    hosts: ["chat.deepseek.com"],
    sharePathRe: /^\/share\/([A-Za-z0-9_-]{6,64})/,
    placeholder: "https://chat.deepseek.com/share/...",
    example: "https://chat.deepseek.com/share/ueme07er23lygrlcia",
  },
  {
    id: "qwen",
    label: "Qwen",
    assistantLabel: "Qwen",
    hosts: ["chat.qwen.ai"],
    sharePathRe: /^\/(?:s|share)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    placeholder: "https://chat.qwen.ai/s/...",
    example: "https://chat.qwen.ai/s/c2195581-f8d7-4396-8658-d383b80955c9",
  },
  {
    id: "grok",
    label: "Grok",
    assistantLabel: "Grok",
    hosts: ["grok.com"],
    sharePathRe: /^\/share\/([A-Za-z0-9_-]+)/,
    placeholder: "https://grok.com/share/...",
    example: "https://grok.com/share/c2hhcmQtMi1jb3B5_ea992213-a246-4765-8244-d79ece7e65fc",
  },
];

function parseUrl(input: string): URL | null {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function matchesHost(hostname: string, hosts: string[]): boolean {
  const host = hostname.toLowerCase();
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

export function getChatProvider(id: ChatProviderId): ChatProviderMeta {
  const found = CHAT_PROVIDERS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown chat provider: ${id}`);
  return found;
}

/** Detects which chat a pasted link belongs to, or null if unsupported. */
export function detectChatProvider(input: string): ChatProviderId | null {
  const url = parseUrl(input);
  if (!url || !url.hostname) return null;

  for (const provider of CHAT_PROVIDERS) {
    if (matchesHost(url.hostname, provider.hosts) && provider.sharePathRe.test(url.pathname)) {
      return provider.id;
    }
  }
  return null;
}

/**
 * Extracts the share id for a known provider. The id is embedded in the
 * canonical share URL returned by the API (query strings are ignored).
 */
export function extractChatShareId(
  id: ChatProviderId,
  input: string,
): string | null {
  const provider = CHAT_PROVIDERS.find((p) => p.id === id);
  const url = parseUrl(input);
  if (!provider || !url || !matchesHost(url.hostname, provider.hosts)) return null;

  const match = url.pathname.match(provider.sharePathRe);
  return match ? match[1] : null;
}

/** Human list of every chat this tool can read, e.g. for prose copy. */
export function supportedChatsLabel(): string {
  const labels = CHAT_PROVIDERS.map((p) => p.label);
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}
