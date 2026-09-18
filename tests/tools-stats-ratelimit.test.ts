import { describe, afterEach, expect, it, vi } from "vitest";
import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/tools/stats";
import { POST } from "@/app/api/tools/stats/route";

// Mock the Redis client before the route module graph is imported. The
// INCR reports a rising counter; EXPIRE is recorded for assertions.
let counter = 0;
let expiredKeys: { key: string; seconds: number }[] = [];

vi.mock("@upstash/redis", () => ({
  Redis: class {
    async incr(): Promise<number> {
      counter += 1;
      return counter;
    }
    async expire(key: string, seconds: number): Promise<number> {
      expiredKeys.push({ key, seconds });
      return 1;
    }
  },
}));

function postRequest(ip: string) {
  return new Request("https://exitcard.dev/api/tools/stats", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": ip,
    },
    body: JSON.stringify({ category: "organize" }),
  });
}

afterEach(() => {
  counter = 0;
  expiredKeys = [];
  vi.unstubAllEnvs();
});

describe("POST /api/tools/stats rate limit", () => {
  it("allows requests within the fixed window and sets an expiry once", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "test-token");

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const response = await POST(postRequest("203.0.113.7"));
      expect(response.status).toBe(200);
    }
    // Fixed window: the TTL is set on the first hit only, so a busy IP
    // cannot keep its own window alive indefinitely.
    expect(expiredKeys).toHaveLength(1);
    expect(expiredKeys[0]?.seconds).toBe(RATE_LIMIT_WINDOW_SECONDS);
    expect(expiredKeys[0]?.key).toContain("203.0.113.7");
  });

  it("returns 429 once the per-IP limit is exceeded", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://example.upstash.io");
    vi.stubEnv("KV_REST_API_TOKEN", "test-token");

    let last: Response | undefined;
    for (let i = 0; i <= RATE_LIMIT_MAX; i++) {
      last = await POST(postRequest("203.0.113.8"));
    }
    expect(last?.status).toBe(429);
  });

  it("fails open when Redis is not configured", async () => {
    for (let i = 0; i <= RATE_LIMIT_MAX; i++) {
      const response = await POST(postRequest("203.0.113.9"));
      expect(response.status).toBe(200);
    }
  });
});
