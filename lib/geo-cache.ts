import { isRecord } from "./parse";
import type { OriginRecord, WeatherRecord } from "./types";
import { lookupOrigin } from "./origin";
import { lookupWeather } from "./weather";
import { upstashRedis } from "./upstash";
import "server-only";

/**
 * Short-TTL cache in front of the geo/weather upstreams. The home page
 * previously hit ipwho/RIPE/ipinfo/ipapi/open-meteo on every render; this
 * bounds those calls to one per IP (or coordinate pair) per TTL window and
 * keeps TTFB stable under repeat visits.
 */
const ORIGIN_TTL_SECONDS = 600;
const WEATHER_TTL_SECONDS = 600;

function hasOriginShape(value: unknown): value is OriginRecord {
  return (
    isRecord(value) &&
    "countryCode" in value &&
    "latitude" in value &&
    "longitude" in value &&
    typeof value.source === "string"
  );
}

function hasWeatherShape(value: unknown): value is WeatherRecord {
  return (
    isRecord(value) &&
    typeof value.source === "string" &&
    "condition" in value &&
    "temperatureC" in value
  );
}

function coordsKeyPart(coords: {
  latitude: number | null;
  longitude: number | null;
}): string | null {
  if (coords.latitude === null || coords.longitude === null) return null;
  // 2 decimals ≈ 1.1 km — enough for weather, keeps the key space tight.
  return `${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`;
}

export async function cachedLookupOrigin(ip: string): Promise<OriginRecord> {
  const redis = upstashRedis();
  const key = `cache:origin:${ip}`;

  if (redis) {
    try {
      const hit: unknown = await redis.get(key);
      if (hasOriginShape(hit)) return hit;
    } catch {
      // cache miss on error — fall through to the upstreams
    }
  }

  const origin = await lookupOrigin(ip);

  // Only cache records that actually resolved; a blank record is usually an
  // upstream hiccup we don't want pinned for ten minutes.
  if (redis && (origin.countryCode !== null || origin.provider !== null)) {
    void redis.set(key, origin, { ex: ORIGIN_TTL_SECONDS }).catch(() => {});
  }
  return origin;
}

export async function cachedLookupWeather(coords: {
  latitude: number | null;
  longitude: number | null;
}): Promise<WeatherRecord> {
  const keyPart = coordsKeyPart(coords);
  const redis = upstashRedis();
  const key = keyPart ? `cache:weather:${keyPart}` : null;

  if (redis && key) {
    try {
      const hit: unknown = await redis.get(key);
      if (hasWeatherShape(hit)) return hit;
    } catch {
      // cache miss on error — fall through to the upstream
    }
  }

  const weather = await lookupWeather(coords);

  if (redis && key && weather.condition !== null) {
    void redis.set(key, weather, { ex: WEATHER_TTL_SECONDS }).catch(() => {});
  }
  return weather;
}
