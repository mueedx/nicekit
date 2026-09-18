import { cachedLookupOrigin, cachedLookupWeather } from "./geo-cache";
import { resolveClientIp } from "./client-ip";
import type { VisitorPage } from "./types";
import { parseRequestFacts } from "./ua";

export async function loadVisitor(headerList: Headers): Promise<VisitorPage> {
  const ip = await resolveClientIp(headerList);
  const origin = await cachedLookupOrigin(ip);
  const weather = await cachedLookupWeather({
    latitude: origin.latitude,
    longitude: origin.longitude,
  });
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost";
  const request = parseRequestFacts(headerList);
  return { ip, host, origin, weather, request };
}

export function visitorJson(visitor: VisitorPage): string {
  return JSON.stringify({
    ip: visitor.ip,
    origin: visitor.origin,
    weather: visitor.weather,
    request: visitor.request,
  });
}
