import { upstashRedis } from "./upstash";
import "server-only";

const VISIT_KEY = "visits:total";
const COUNTRIES_KEY = "visits:countries";

export type PageVisitRecord = {
  visits: number | null;
  countryCodes: string[];
};

function normalizeCountryCode(code: string | null): string | null {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  return code.toUpperCase();
}

function isCountryHash(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function countryCodesFromHash(hash: Record<string, string>): string[] {
  return Object.keys(hash)
    .map((key) => key.toUpperCase())
    .filter((key) => /^[A-Z]{2}$/.test(key))
    .sort();
}

export async function recordPageVisit(
  countryCode: string | null,
): Promise<PageVisitRecord> {
  const redis = upstashRedis();
  if (!redis) return { visits: null, countryCodes: [] };

  const code = normalizeCountryCode(countryCode);

  try {
    const pipe = redis.pipeline();
    pipe.incr(VISIT_KEY);
    if (code) {
      pipe.hset(COUNTRIES_KEY, { [code]: "yes" });
    }
    pipe.hgetall(COUNTRIES_KEY);
    const results = await pipe.exec();

    const incrResult = results[0];
    const hashResult = results[code ? 2 : 1];

    const visits =
      typeof incrResult === "number" && Number.isFinite(incrResult)
        ? incrResult
        : null;

    const countryCodes = isCountryHash(hashResult)
      ? countryCodesFromHash(hashResult)
      : [];

    return { visits, countryCodes };
  } catch {
    return { visits: null, countryCodes: [] };
  }
}
