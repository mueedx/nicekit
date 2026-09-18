// lib/claude.ts - Public Claude Chat (claude.ai/share/...) Reading & Parsing Engine
// Designed for Next.js App Router (Node runtime)
// Ponytail principle: Use native fetch and stdlib string/regex parsing. No heavy dependencies.

export interface ClaudeMessage {
  role: 'human' | 'assistant';
  text: string;
}

export interface ClaudeChat {
  uuid: string;
  name: string;
  messageCount: number;
  messages: ClaudeMessage[];
  fetchedAt: string;
}

/** Machine-readable status for Claude link validation. */
export type ClaudeLinkStatus =
  | 'valid'
  | 'invalid_url'
  | 'not_found'
  | 'private'
  | 'empty'
  | 'blocked'
  | 'error';

export class ClaudeLinkError extends Error {
  code: ClaudeLinkStatus;
  constructor(code: ClaudeLinkStatus, message: string) {
    super(message);
    this.code = code;
    this.name = 'ClaudeLinkError';
  }
}


/**
 * Extracts a clean Claude share UUID from arbitrary URLs or raw IDs.
 * Expected: https://claude.ai/share/<uuid>
 */
export function extractClaudeShareId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  const urlMatch = trimmed.match(/claude\.ai\/share\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (urlMatch) return urlMatch[1].toLowerCase();

  const idMatch = trimmed.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (idMatch) return idMatch[1].toLowerCase();

  return null;
}

/**
 * Recursively extracts readable text from Claude message content blocks.
 * Skips internal noise (thinking, tool_use) but keeps text and tool results.
 */
function extractBlockText(content: unknown, depth = 0): string {
  if (content == null || depth > 6) return '';
  if (typeof content === 'string') return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((block) => extractBlockText(block, depth + 1))
      .filter(Boolean)
      .join('\n\n');
  }

  if (typeof content === 'object') {
    const block = content as Record<string, any>;
    const type = block.type as string | undefined;

    if (type === 'thinking' || type === 'redacted_thinking') return ''; // skip internal reasoning

    if (type === 'tool_use') {
      return `[tool: ${block.name || 'unknown'}]`;
    }

    if (type === 'tool_result') {
      return extractBlockText(block.content, depth + 1);
    }

    // Text block or dict with a text field
    if (typeof block.text === 'string' && block.text.trim()) {
      return block.text.trim();
    }
    if (block.content !== undefined) {
      return extractBlockText(block.content, depth + 1);
    }
  }

  return '';
}

function isCloudflareChallenge(body: string): boolean {
  return (
    body.includes('Just a moment...') ||
    body.includes('challenges.cloudflare.com') ||
    body.includes('cf-challenge')
  );
}

/**
 * Probes the public share HTML page to distinguish a revoked/private share
 * (page still live) from a deleted/invalid UUID (page 404).
 */
async function checkSharePageExists(id: string): Promise<boolean> {
  try {
    const res = await fetch(`https://claude.ai/share/${id}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    const body = await res.text();
    return res.ok && !isCloudflareChallenge(body);
  } catch {
    return false; // inconclusive → report as not_found
  }
}

/**
 * Fetches a public Claude chat snapshot and normalizes it into a ClaudeChat.
 * Retries with backoff when Cloudflare challenges the request (it is intermittent).
 */
export async function fetchClaudeChat(id: string): Promise<ClaudeChat> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 800));
    }
    try {
      return await fetchClaudeChatOnce(id);
    } catch (err: any) {
      lastError = err;
      if (!err?.message?.includes('Cloudflare')) throw err;
    }
  }

  throw lastError ?? new Error('Failed to fetch Claude chat.');
}

async function fetchClaudeChatOnce(id: string): Promise<ClaudeChat> {
  const shareUrl = `https://claude.ai/share/${id}`;
  const apiUrl = `https://claude.ai/api/chat_snapshots/${id}?rendering_mode=messages&render_all_tools=true`;

  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: shareUrl,
    },
    next: { revalidate: 300 },
  });

  const rawBody = await response.text();

  if (isCloudflareChallenge(rawBody)) {
    throw new ClaudeLinkError(
      'blocked',
      'Claude is blocking automated access (Cloudflare challenge). The link may still be valid — try again in a few seconds.'
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new ClaudeLinkError(
        'not_found',
        'This Claude share link does not exist or has been deleted. Double-check the URL.'
      );
    }
    if (response.status === 401 || response.status === 403) {
      // Distinguish "revoked/private share" from a hard 404 by probing the public page
      const isLivePage = await checkSharePageExists(id);
      throw new ClaudeLinkError(
        isLivePage ? 'private' : 'not_found',
        isLivePage
          ? 'This chat is no longer shared publicly. The owner may have revoked access.'
          : 'This Claude share link does not exist or has been deleted. Double-check the URL.'
      );
    }
    throw new ClaudeLinkError('error', `Failed to fetch Claude chat: HTTP ${response.status}`);
  }

  let data: Record<string, any>;
  try {
    data = JSON.parse(rawBody);
  } catch {
    throw new ClaudeLinkError('error', 'Claude returned an unexpected (non-JSON) response.');
  }

  if (data.is_public === false) {
    throw new ClaudeLinkError(
      'private',
      'This chat is no longer shared publicly. The owner may have revoked access.'
    );
  }

  const messages: ClaudeMessage[] = [];

  // Snapshot shape: { chat_messages: [...] } or { messages: [...] }
  // Each message: { sender: 'human'|'assistant', content: string | blocks[] }
  const rawMessages: any[] =
    (Array.isArray(data.chat_messages) && data.chat_messages) ||
    (Array.isArray(data.messages) && data.messages) ||
    (Array.isArray(data.chat_snapshot?.messages) && data.chat_snapshot.messages) ||
    [];

  for (const msg of rawMessages) {
    const sender = msg?.sender === 'human' || msg?.role === 'human' ? 'human' : 'assistant';
    const text = extractBlockText(msg?.content ?? msg?.text);
    if (text) messages.push({ role: sender, text });
  }

  if (messages.length === 0) {
    throw new ClaudeLinkError(
      'empty',
      'This chat is shared but contains no readable text messages (it may be empty or media-only).'
    );
  }

  const name =
    (typeof data.snapshot_name === 'string' && data.snapshot_name.trim()) ||
    (typeof data.name === 'string' && data.name.trim()) ||
    (typeof data.chat_snapshot?.name === 'string' && data.chat_snapshot.name.trim()) ||
    (typeof data.chat?.name === 'string' && data.chat.name.trim()) ||
    'Claude Chat';

  return {
    uuid: id,
    name,
    messageCount: messages.length,
    messages,
    fetchedAt: new Date().toISOString(),
  };
}

/** Filename-safe version of the chat name. */
export function safeChatFileName(name: string): string {
  const clean = (name || 'claude-chat').replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '-').slice(0, 60);
  return clean || 'claude-chat';
}

/**
 * Renders the chat as GitHub-flavored Markdown.
 */
export function chatToMarkdown(chat: ClaudeChat): string {
  const out: string[] = [];
  out.push(`# ${chat.name}`);
  out.push('');
  out.push(`> Exported from [claude.ai/share/${chat.uuid}](https://claude.ai/share/${chat.uuid}) — ${chat.messageCount} messages.`);
  out.push('');

  for (const msg of chat.messages) {
    const heading = msg.role === 'human' ? '## 🧑 You' : '## 🤖 Claude';
    out.push(heading);
    out.push('');
    out.push(msg.text);
    out.push('');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/**
 * Renders the chat as plain text.
 */
export function chatToText(chat: ClaudeChat): string {
  const bar = '='.repeat(60);
  const out: string[] = [];
  out.push(bar);
  out.push(chat.name);
  out.push(`Source: https://claude.ai/share/${chat.uuid}`);
  out.push(`Messages: ${chat.messageCount}`);
  out.push(bar);
  out.push('');

  for (const msg of chat.messages) {
    const label = msg.role === 'human' ? 'YOU' : 'CLAUDE';
    out.push(`--- ${label} ---`);
    out.push('');
    out.push(msg.text);
    out.push('');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** Renders the chat as a list of sections for DOCX/PDF exporters. */
export interface ChatSection {
  heading: string | null;
  text: string;
}

export function chatToSections(chat: ClaudeChat): ChatSection[] {
  const sections: ChatSection[] = [
    { heading: null, text: `Source: https://claude.ai/share/${chat.uuid} · ${chat.messageCount} messages` },
  ];

  for (const msg of chat.messages) {
    sections.push({
      heading: msg.role === 'human' ? 'YOU' : 'CLAUDE',
      text: msg.text,
    });
  }

  return sections;
}
