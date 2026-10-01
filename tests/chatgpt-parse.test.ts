import { describe, expect, it } from "vitest";
import {
  extractChatGptShareId,
  decodeTurboStream,
  parseShareLoaderData,
  extractChatGptMessages,
  chatGptToDocChat,
  chatGptToMarkdown,
  chatGptToText,
  type ChatGptChat,
} from "@/lib/chatgpt";
import { chatToDocx, chatToPdf } from "@/lib/exporters";

const ID = "6abe8898-fff8-83ee-8574-0d88ee55995c";

describe("extractChatGptShareId", () => {
  it("accepts a full share URL", () => {
    expect(extractChatGptShareId(`https://chatgpt.com/share/${ID}`)).toBe(ID);
  });

  it("accepts the legacy host and a raw id", () => {
    expect(extractChatGptShareId(`https://chat.openai.com/share/${ID}`)).toBe(ID);
    expect(extractChatGptShareId(ID.toUpperCase())).toBe(ID);
  });

  it("rejects links that are not ChatGPT shares", () => {
    expect(extractChatGptShareId("https://claude.ai/share/" + ID)).toBeNull();
    expect(extractChatGptShareId("https://chatgpt.com/c/" + ID)).toBeNull();
    expect(extractChatGptShareId("")).toBeNull();
  });
});

describe("decodeTurboStream", () => {
  it("resolves an object whose values are pool indices", () => {
    expect(decodeTurboStream([{ _1: 2 }, "name", "Chat"])).toEqual({ name: "Chat" });
  });

  it("resolves arrays of pool indices", () => {
    // pool[1] and pool[3] are the referenced strings.
    expect(decodeTurboStream([[1, 3], "a", "unused", "b"])).toEqual(["a", "b"]);
  });

  it("maps the negative sentinels for null and undefined", () => {
    // Sentinels appear as the *reference* value, not as pool entries.
    expect(decodeTurboStream([{ _1: -7 }, "n"])).toEqual({ n: null });
    expect(decodeTurboStream([{ _1: -5 }, "u"])).toEqual({ u: undefined });
  });
});

describe("parseShareLoaderData", () => {
  it("reads the share loader data and ignores deferred chunks", () => {
    const pool = [
      { _1: 2 },
      "routes/share.$shareId.($action)",
      { _3: 4 },
      "data",
      { _5: 6 },
      "serverResponse",
      { _7: 8 },
      "type",
      "data",
    ];
    const body = `${JSON.stringify(pool)}\nE9:[["SanitizedError"],"Error","boom"]\n`;
    const loaderData = parseShareLoaderData(body);
    expect(loaderData?.serverResponse).toEqual({ type: "data" });
  });

  it("returns null for a non-turbo body", () => {
    expect(parseShareLoaderData("<html>challenge</html>")).toBeNull();
  });
});

describe("extractChatGptMessages", () => {
  it("keeps only visible user/assistant text turns", () => {
    const conversation = {
      linear_conversation: [
        { message: null },
        { message: { author: { role: "user" }, content: { content_type: "text", parts: ["Hi"] } } },
        {
          message: {
            author: { role: "system" },
            content: { content_type: "text", parts: ["secret"] },
            metadata: { is_visually_hidden_from_conversation: true },
          },
        },
        {
          message: {
            author: { role: "assistant" },
            content: { content_type: "text", parts: ["", "Hello there"] },
          },
        },
        { message: { author: { role: "tool" }, content: { content_type: "text", parts: ["redacted"] } } },
        {
          message: {
            author: { role: "assistant" },
            content: { content_type: "thoughts", parts: ["thinking"] },
          },
        },
        { message: { author: { role: "user" }, content: { content_type: "text", parts: ["   "] } } },
      ],
    };

    expect(extractChatGptMessages(conversation)).toEqual([
      { role: "user", text: "Hi" },
      { role: "assistant", text: "Hello there" },
    ]);
  });
});

describe("chatGpt exporters", () => {
  const chat: ChatGptChat = {
    id: ID,
    name: "Interview Prep",
    messageCount: 2,
    messages: [
      { role: "user", text: "Hello" },
      { role: "assistant", text: "Hi there" },
    ],
    fetchedAt: "2026-01-01T00:00:00.000Z",
  };

  it("maps onto the shared DocChat shape with a share source URL", () => {
    const doc = chatGptToDocChat(chat);
    expect(doc.sourceUrl).toBe(`https://chatgpt.com/share/${ID}`);
    expect(doc.messages[0]).toEqual({ role: "human", text: "Hello" });
    expect(doc.plainLabels).toEqual({ human: "YOU", assistant: "CHATGPT" });
  });

  it("renders Markdown and text with the ChatGPT speaker labels", () => {
    const md = chatGptToMarkdown(chat);
    expect(md).toContain("# Interview Prep");
    expect(md).toContain("🤖 ChatGPT");
    expect(md).toContain("Hi there");

    const txt = chatGptToText(chat);
    expect(txt).toContain("--- YOU ---");
    expect(txt).toContain("--- CHATGPT ---");
  });

  it("produces valid DOCX and PDF bytes through the shared exporters", () => {
    const doc = chatGptToDocChat(chat);
    const docx = chatToDocx(doc);
    const pdf = chatToPdf(doc);

    expect(String.fromCharCode(docx[0], docx[1])).toBe("PK");
    expect(String.fromCharCode(...pdf.slice(0, 5))).toBe("%PDF-");
  });
});
