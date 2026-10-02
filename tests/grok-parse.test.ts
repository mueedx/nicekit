import { describe, expect, it } from "vitest";
import {
  extractGrokMessages,
  extractGrokShareId,
  grokToDocChat,
  type GrokChat,
} from "@/lib/grok";

const ID = "c2hhcmQtMi1jb3B5_ea992213-a246-4765-8244-d79ece7e65fc";

describe("extractGrokShareId", () => {
  it("accepts a full share URL", () => {
    expect(extractGrokShareId(`https://grok.com/share/${ID}`)).toBe(ID);
  });

  it("accepts a bare Grok token (base64 + underscore + uuid)", () => {
    expect(extractGrokShareId(ID)).toBe(ID);
  });

  it("rejects links that are not Grok shares", () => {
    expect(extractGrokShareId("https://claude.ai/share/6abe8898-fff8-83ee-8574-0d88ee55995c")).toBeNull();
    expect(extractGrokShareId("")).toBeNull();
  });
});

describe("extractGrokMessages", () => {
  it("maps sender to roles, keeps order, and skips empty turns", () => {
    const responses = [
      { sender: "human", message: "Refer to the following content:" },
      { sender: "assistant", message: "**Your screenshot shows a Reddit thread**" },
      { sender: "human", message: "your thoughts ?" },
      { sender: "assistant", message: "" },
    ];

    expect(extractGrokMessages(responses)).toEqual([
      { role: "human", text: "Refer to the following content:" },
      { role: "assistant", text: "**Your screenshot shows a Reddit thread**" },
      { role: "human", text: "your thoughts ?" },
    ]);
  });

  it("treats unknown senders as the assistant", () => {
    expect(extractGrokMessages([{ sender: "model", message: "hi" }])).toEqual([
      { role: "assistant", text: "hi" },
    ]);
  });
});

describe("Grok exporters", () => {
  const chat: GrokChat = {
    id: ID,
    name: "Refer to the following content:",
    messageCount: 4,
    messages: [
      { role: "human", text: "Refer to the following content:" },
      { role: "assistant", text: "**Your screenshot shows a thread**" },
    ],
    fetchedAt: "2026-01-01T00:00:00.000Z",
  };

  it("maps onto the shared DocChat shape with a share source URL", () => {
    const doc = grokToDocChat(chat);
    expect(doc.sourceUrl).toBe(`https://grok.com/share/${ID}`);
    expect(doc.plainLabels).toEqual({ human: "YOU", assistant: "GROK" });
    expect(doc.messages[1]).toEqual({ role: "assistant", text: "**Your screenshot shows a thread**" });
  });
});
