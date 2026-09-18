import { isValidCategory } from "./categories";
import { upstashRedis } from "../upstash";
import type { ConversionStats, ToolCategory } from "./types";
import "server-only";

export { isValidCategory };

const CONVERSIONS_HASH = "tools:conversions";
const CONVERSIONS_TOTAL = "tools:conversions:total";
const RATE_LIMIT_PREFIX = "ratelimit:tools-stats";
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_MAX = 30;

function parseCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export async function shouldAllowConversion(
  ip: string | null,
): Promise<boolean> {
  // Best-effort protection against counter inflation: fixed window per IP.
  // The expiry is set only on the first hit of a window, so the window
  // actually rolls over instead of sliding forever with the traffic.
  // Without Redis (or a usable IP) we fail open — the beacon is not
  // security-critical and must not block legitimate conversions.
  const redis = upstashRedis();
  if (!redis || !ip) return true;

  const key = `${RATE_LIMIT_PREFIX}:${ip}`;
  try {
    const count = parseCount(await redis.incr(key));
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }
    return count <= RATE_LIMIT_MAX;
  } catch {
    return true;
  }
}

export async function recordConversion(
  category: ToolCategory,
): Promise<{ ok: boolean }> {
  if (!isValidCategory(category)) return { ok: false };

  const redis = upstashRedis();
  if (!redis) return { ok: false };

  try {
    const pipe = redis.pipeline();
    pipe.hincrby(CONVERSIONS_HASH, category, 1);
    pipe.incr(CONVERSIONS_TOTAL);
    await pipe.exec();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function getToolConversionStats(): Promise<ConversionStats> {
  const redis = upstashRedis();
  if (!redis) return { byCategory: {}, total: null };

  try {
    const pipe = redis.pipeline();
    pipe.hgetall(CONVERSIONS_HASH);
    pipe.get(CONVERSIONS_TOTAL);
    const results = await pipe.exec();

    const hash = results[0];
    const totalRaw = results[1];

    const byCategory: Partial<Record<ToolCategory, number>> = {};
    if (hash && typeof hash === "object" && !Array.isArray(hash)) {
      for (const [key, value] of Object.entries(hash)) {
        if (isValidCategory(key)) {
          byCategory[key] = parseCount(value);
        }
      }
    }

    const total =
      totalRaw === null || totalRaw === undefined
        ? null
        : parseCount(totalRaw);

    return { byCategory, total };
  } catch {
    return { byCategory: {}, total: null };
  }
}
