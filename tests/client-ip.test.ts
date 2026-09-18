import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveClientIp } from "@/lib/client-ip";

function headersWith(entries: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(entries)) {
    headers.set(key, value);
  }
  return headers;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("resolveClientIp header precedence", () => {
  it("prefers x-real-ip over a spoofed x-forwarded-for first hop", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const ip = await resolveClientIp(
      headersWith({
        "x-real-ip": "203.0.113.7",
        "x-forwarded-for": "1.2.3.4, 203.0.113.7",
      }),
    );
    expect(ip).toBe("203.0.113.7");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("prefers x-vercel-forwarded-for over client-supplied x-forwarded-for", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const ip = await resolveClientIp(
      headersWith({
        "x-vercel-forwarded-for": "198.51.100.9",
        "x-forwarded-for": "1.2.3.4",
      }),
    );
    expect(ip).toBe("198.51.100.9");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("takes the rightmost hop of x-forwarded-for, not the first", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const ip = await resolveClientIp(
      headersWith({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 198.51.100.23" }),
    );
    expect(ip).toBe("198.51.100.23");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the platform IP without calling the egress fallback", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const ip = await resolveClientIp(
      headersWith({ "x-real-ip": "203.0.113.7" }),
    );
    expect(ip).toBe("203.0.113.7");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("resolveClientIp egress fallback", () => {
  it("falls back to the egress IP when no headers are present (local dev)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ip: "192.0.2.44" }), { status: 200 }),
      ),
    );
    const ip = await resolveClientIp(new Headers());
    expect(ip).toBe("192.0.2.44");
  });

  it("falls back to the egress IP for loopback requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ip: "192.0.2.44" }), { status: 200 }),
      ),
    );
    const ip = await resolveClientIp(
      headersWith({ "x-real-ip": "127.0.0.1" }),
    );
    expect(ip).toBe("192.0.2.44");
  });

  it("does not call the egress fallback for non-loopback private IPs", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const ip = await resolveClientIp(
      headersWith({ "x-real-ip": "10.1.2.3" }),
    );
    expect(ip).toBe("10.1.2.3");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 0.0.0.0 when nothing is available and egress fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    const ip = await resolveClientIp(new Headers());
    expect(ip).toBe("0.0.0.0");
  });
});
