import { describe, expect, it } from "vitest";
import {
  extractQwenMessages,
  extractQwenShareId,
  qwenToDocChat,
  type QwenChat,
} from "@/lib/qwen";

const ID = "c2195581-f8d7-4396-8658-d383b80955c9";

describe("extractQwenShareId", () => {
  it("accepts the /s/ share URL, including its query string", () => {
    expect(extractQwenShareId(`https://chat.qwen.ai/s/${ID}?fev=0.3.12`)).toBe(ID);
    expect(extractQwenShareId(`https://chat.qwen.ai/share/${ID}`)).toBe(ID);
  });

  it("accepts a bare uuid", () => {
    expect(extractQwenShareId(ID.toUpperCase())).toBe(ID);
  });

  it("rejects links that are not Qwen shares", () => {
    expect(extractQwenShareId("https://grok.com/share/abc-def")).toBeNull();
    expect(extractQwenShareId("")).toBeNull();
  });
});

describe("extractQwenMessages", () => {
  it("walks parent/child links and falls back to content_list", () => {
    const history = {
      messages: {
        a: {
          id: "a",
          role: "user",
          content: "- add GIN vs normal postgres index",
          parentId: null,
          childrenIds: ["b"],
        },
        b: {
          id: "b",
          role: "assistant",
          // Qwen often leaves `content` empty and puts the reply here.
          content: "",
          content_list: [{ content: "Here are the additions to your file." }],
          parentId: "a",
          childrenIds: [],
        },
      },
    };

    expect(extractQwenMessages(history)).toEqual([
      { role: "human", text: "- add GIN vs normal postgres index" },
      { role: "assistant", text: "Here are the additions to your file." },
    ]);
  });

  it("prefers a non-empty content string over content_list", () => {
    const history = {
      messages: {
        a: {
          id: "a",
          role: "user",
          content: "hello",
          content_list: [{ content: "ignored" }],
          parentId: null,
          childrenIds: [],
        },
      },
    };

    expect(extractQwenMessages(history)).toEqual([{ role: "human", text: "hello" }]);
  });

  it("returns nothing for an empty history", () => {
    expect(extractQwenMessages({ messages: {} })).toEqual([]);
  });
});

describe("Qwen exporters", () => {
  const chat: QwenChat = {
    id: ID,
    name: "PostgreSQL Indexing Interview Guide",
    messageCount: 2,
    messages: [
      { role: "human", text: "add GIN vs normal index" },
      { role: "assistant", text: "Here are the additions." },
    ],
    fetchedAt: "2026-01-01T00:00:00.000Z",
  };

  it("maps onto the shared DocChat shape with a share source URL", () => {
    const doc = qwenToDocChat(chat);
    expect(doc.sourceUrl).toBe(`https://chat.qwen.ai/s/${ID}`);
    expect(doc.plainLabels).toEqual({ human: "YOU", assistant: "QWEN" });
    expect(doc.messages[0]).toEqual({ role: "human", text: "add GIN vs normal index" });
  });
});
