import { describe, expect, it } from "vitest";
import {
  CHAT_PROVIDERS,
  detectChatProvider,
  extractChatShareId,
  supportedChatsLabel,
} from "@/lib/chat-providers";

/** The real links the tool was built against. */
const EXAMPLES: Record<string, string> = {
  claude: "https://claude.ai/share/6abe8898-fff8-83ee-8574-0d88ee55995c",
  chatgpt: "https://chatgpt.com/share/6abe8898-fff8-83ee-8574-0d88ee55995c",
  deepseek: "https://chat.deepseek.com/share/ueme07er23lygrlcia",
  qwen: "https://chat.qwen.ai/s/c2195581-f8d7-4396-8658-d383b80955c9?fev=0.3.12",
  grok: "https://grok.com/share/c2hhcmQtMi1jb3B5_ea992213-a246-4765-8244-d79ece7e65fc",
};

describe("CHAT_PROVIDERS", () => {
  it("lists every supported chat", () => {
    expect(CHAT_PROVIDERS.map((p) => p.id)).toEqual([
      "claude",
      "chatgpt",
      "deepseek",
      "qwen",
      "grok",
    ]);
  });

  it("names them for the supported-chats copy", () => {
    expect(supportedChatsLabel()).toBe("Claude, ChatGPT, DeepSeek, Qwen and Grok");
  });
});

describe("detectChatProvider", () => {
  it("detects every supported share link", () => {
    for (const [provider, url] of Object.entries(EXAMPLES)) {
      expect(detectChatProvider(url), `${provider}: ${url}`).toBe(provider);
    }
  });

  it("ignores query strings and accepts scheme-less pastes", () => {
    expect(detectChatProvider("chat.qwen.ai/s/c2195581-f8d7-4396-8658-d383b80955c9?fev=1")).toBe(
      "qwen",
    );
    expect(detectChatProvider("grok.com/share/c2hhcmQtMi1jb3B5_x")).toBe("grok");
  });

  it("rejects unsupported hosts and non-share paths", () => {
    expect(detectChatProvider("https://example.com/share/abc")).toBeNull();
    expect(detectChatProvider("https://claude.ai/chat/xyz")).toBeNull();
    expect(detectChatProvider("https://chat.deepseek.com/")).toBeNull();
    expect(detectChatProvider("not a url at all")).toBeNull();
    expect(detectChatProvider("")).toBeNull();
  });
});

describe("extractChatShareId", () => {
  it("pulls the id out of the canonical share URL", () => {
    expect(extractChatShareId("claude", EXAMPLES.claude)).toBe(
      "6abe8898-fff8-83ee-8574-0d88ee55995c",
    );
    expect(extractChatShareId("deepseek", EXAMPLES.deepseek)).toBe("ueme07er23lygrlcia");
    expect(extractChatShareId("qwen", EXAMPLES.qwen)).toBe(
      "c2195581-f8d7-4396-8658-d383b80955c9",
    );
    expect(extractChatShareId("grok", EXAMPLES.grok)).toBe(
      "c2hhcmQtMi1jb3B5_ea992213-a246-4765-8244-d79ece7e65fc",
    );
  });

  it("refuses a link that belongs to a different provider", () => {
    expect(extractChatShareId("claude", EXAMPLES.chatgpt)).toBeNull();
    expect(extractChatShareId("grok", EXAMPLES.deepseek)).toBeNull();
    expect(extractChatShareId("qwen", EXAMPLES.grok)).toBeNull();
  });
});
