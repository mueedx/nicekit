import { describe, expect, it } from "vitest";
import {
  chatToMarkdown,
  chatToText,
  deepSeekToDocChat,
  extractDeepSeekMessages,
  extractDeepSeekShareId,
  type DeepSeekChat,
} from "@/lib/deepseek";
import { chatToDocx, chatToPdf } from "@/lib/exporters";

const ID = "ueme07er23lygrlcia";

describe("extractDeepSeekShareId", () => {
  it("accepts a full share URL", () => {
    expect(extractDeepSeekShareId(`https://chat.deepseek.com/share/${ID}`)).toBe(ID);
  });

  it("accepts a bare share token", () => {
    expect(extractDeepSeekShareId(ID)).toBe(ID);
  });

  it("rejects links that are not DeepSeek shares", () => {
    expect(extractDeepSeekShareId(`https://chatgpt.com/share/${ID}`)).toBeNull();
    expect(extractDeepSeekShareId("")).toBeNull();
  });
});

describe("extractDeepSeekMessages", () => {
  it("reads REQUEST/RESPONSE fragments and skips file-only turns", () => {
    const biz = {
      messages: [
        {
          role: "USER",
          fragments: [
            { type: "FILE", files: [{ file_name: "image.png" }] },
            { type: "REQUEST", content: "tell my AI to fix this UI mess" },
          ],
        },
        {
          role: "ASSISTANT",
          fragments: [{ type: "RESPONSE", content: "Here are a few ways to fix it." }],
        },
        { role: "USER", fragments: [{ type: "FILE", files: [{ file_name: "a.png" }] }] },
      ],
    };

    expect(extractDeepSeekMessages(biz)).toEqual([
      { role: "human", text: "tell my AI to fix this UI mess" },
      { role: "assistant", text: "Here are a few ways to fix it." },
    ]);
  });

  it("accepts the legacy plain-content shape", () => {
    const biz = {
      messages: [
        { role: "USER", content: "hi" },
        { role: "ASSISTANT", content: "hello" },
      ],
    };

    expect(extractDeepSeekMessages(biz)).toEqual([
      { role: "human", text: "hi" },
      { role: "assistant", text: "hello" },
    ]);
  });
});

describe("DeepSeek exporters", () => {
  const chat: DeepSeekChat = {
    id: ID,
    name: "UI cleanup",
    messageCount: 2,
    messages: [
      { role: "human", text: "fix this UI" },
      { role: "assistant", text: "Try this." },
    ],
    fetchedAt: "2026-01-01T00:00:00.000Z",
  };

  it("maps onto the shared DocChat shape with a share source URL", () => {
    const doc = deepSeekToDocChat(chat);
    expect(doc.sourceUrl).toBe(`https://chat.deepseek.com/share/${ID}`);
    expect(doc.plainLabels).toEqual({ human: "YOU", assistant: "DEEPSEEK" });
    expect(doc.messages).toHaveLength(2);
  });

  it("renders Markdown and text with the DeepSeek speaker labels", () => {
    const md = chatToMarkdown(chat);
    expect(md).toContain("# UI cleanup");
    expect(md).toContain("🤖 DeepSeek");

    const txt = chatToText(chat);
    expect(txt).toContain("--- YOU ---");
    expect(txt).toContain("--- DEEPSEEK ---");
  });

  it("produces valid DOCX and PDF bytes", () => {
    const doc = deepSeekToDocChat(chat);
    const docx = chatToDocx(doc);
    const pdf = chatToPdf(doc);

    expect(String.fromCharCode(docx[0], docx[1])).toBe("PK");
    expect(String.fromCharCode(...pdf.slice(0, 5))).toBe("%PDF-");
  });
});
