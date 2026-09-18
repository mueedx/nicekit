import { isRecord } from "./parse";

export type DnsResolver = {
  ip: string;
  geo: string | null;
};

function randomAlnum(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i++) {
    const b = bytes[i];
    if (b === undefined) continue;
    const ch = alphabet[b % alphabet.length];
    if (ch !== undefined) out += ch;
  }
  return out;
}

export function parseDnsProbe(body: unknown): DnsResolver | null {
  if (!isRecord(body) || !isRecord(body.dns)) return null;
  const ip = body.dns.ip;
  if (typeof ip !== "string" || ip.length === 0) return null;
  const geo =
    typeof body.dns.geo === "string" && body.dns.geo.length > 0
      ? body.dns.geo
      : null;
  return { ip, geo };
}

export async function probeBrowserDns(
  signal: AbortSignal,
): Promise<DnsResolver | null> {
  const host = `${randomAlnum(32)}.edns.ip-api.com`;
  const response = await fetch(`https://${host}/json`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) return null;
  const body: unknown = await response.json();
  return parseDnsProbe(body);
}
