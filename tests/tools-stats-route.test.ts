import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/tools/stats/route";

function postRequest(body: unknown, headers?: Record<string, string>) {
  return new Request("https://exitcard.dev/api/tools/stats", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/tools/stats", () => {
  it("returns 200 for a valid category even without Redis", async () => {
    const response = await POST(postRequest({ category: "organize" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST(postRequest("{not json"));
    expect(response.status).toBe(400);
  });

  it("returns 400 (not 500) for a JSON null body", async () => {
    const response = await POST(postRequest(null));
    expect(response.status).toBe(400);
  });

  it("returns 400 (not 500) for a JSON array body", async () => {
    const response = await POST(postRequest(["organize"]));
    expect(response.status).toBe(400);
  });

  it("returns 400 for an unknown category", async () => {
    const response = await POST(postRequest({ category: "definitely-not-real" }));
    expect(response.status).toBe(400);
  });

  it("allows requests with no Origin header (curl, server-to-server)", async () => {
    const response = await POST(
      postRequest({ category: "organize" }),
    );
    expect(response.status).toBe(200);
  });

  it("allows requests whose Origin matches the host", async () => {
    const response = await POST(
      postRequest({ category: "organize" }, { origin: "https://exitcard.dev" }),
    );
    expect(response.status).toBe(200);
  });

  it("rejects cross-origin requests with 403", async () => {
    const response = await POST(
      postRequest(
        { category: "organize" },
        { origin: "https://evil.example" },
      ),
    );
    expect(response.status).toBe(403);
  });
});
