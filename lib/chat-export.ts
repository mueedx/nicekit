// lib/chat-export.ts - Provider-agnostic chat rendering shared by every exporter.
// Claude and ChatGPT each parse their own share format, then map onto DocChat so
// the Markdown / TXT / DOCX / PDF writers exist exactly once.

export interface DocChatMessage {
  role: "human" | "assistant";
  text: string;
}

/**
 * The neutral shape every exporter consumes. `sourceUrl` is the canonical link
 * back to the public conversation (e.g. https://claude.ai/share/<uuid>).
 */
export interface DocChat {
  name: string;
  sourceUrl: string;
  messageCount: number;
  /** Emoji labels used in the Markdown export headings. */
  markdownLabels: { human: string; assistant: string };
  /** Plain uppercase labels used in TXT/DOCX/PDF speaker rows. */
  plainLabels: { human: string; assistant: string };
  messages: DocChatMessage[];
}

export interface DocChatSection {
  heading: string | null;
  text: string;
}

function linkText(sourceUrl: string): string {
  return sourceUrl.replace(/^https?:\/\//, "");
}

/** Renders the chat as GitHub-flavored Markdown. */
export function docChatToMarkdown(chat: DocChat): string {
  const out: string[] = [];
  out.push(`# ${chat.name}`);
  out.push("");
  out.push(
    `> Exported from [${linkText(chat.sourceUrl)}](${chat.sourceUrl}) — ${chat.messageCount} messages.`,
  );
  out.push("");

  for (const msg of chat.messages) {
    out.push(
      msg.role === "human"
        ? `## ${chat.markdownLabels.human}`
        : `## ${chat.markdownLabels.assistant}`,
    );
    out.push("");
    out.push(msg.text);
    out.push("");
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** Renders the chat as plain text. */
export function docChatToText(chat: DocChat): string {
  const bar = "=".repeat(60);
  const out: string[] = [];
  out.push(bar);
  out.push(chat.name);
  out.push(`Source: ${chat.sourceUrl}`);
  out.push(`Messages: ${chat.messageCount}`);
  out.push(bar);
  out.push("");

  for (const msg of chat.messages) {
    out.push(
      `--- ${msg.role === "human" ? chat.plainLabels.human : chat.plainLabels.assistant} ---`,
    );
    out.push("");
    out.push(msg.text);
    out.push("");
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** Renders the chat as a list of sections for the DOCX/PDF exporters. */
export function docChatToSections(chat: DocChat): DocChatSection[] {
  const sections: DocChatSection[] = [
    { heading: null, text: `Source: ${chat.sourceUrl} · ${chat.messageCount} messages` },
  ];

  for (const msg of chat.messages) {
    sections.push({
      heading: msg.role === "human" ? chat.plainLabels.human : chat.plainLabels.assistant,
      text: msg.text,
    });
  }

  return sections;
}
