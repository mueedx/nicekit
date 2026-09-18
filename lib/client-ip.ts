import { isRecord } from "./parse";

function firstHop(header: string | null): string | null {
  if (!header) return null;
  const hop = header.split(",")[0]?.trim();
  return hop && hop.length > 0 ? hop : null;
}

function lastHop(header: string | null): string | null {
  if (!header) return null;
  const hop = header.split(",").at(-1)?.trim();
  return hop && hop.length > 0 ? hop : null;
}

function isLoopback(ip: string): boolean {
  return ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1";
}

function isLoopbackOrPrivate(ip: string): boolean {
  if (isLoopback(ip)) {
    return true;
  }
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) {
    return true;
  }
  const m = /^172\.(\d+)\./.exec(ip);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) {
    return true;
  }
  return false;
}

export function clientIpFromHeaders(headers: Headers): string | null {
  // Platform-set headers are trusted; x-forwarded-for is not, because the
  // client can supply its own leftmost hop and proxies append to the chain.
  // So prefer the platform values, and when falling back to
  // x-forwarded-for, take the rightmost (least spoofable) hop.
  return (
    firstHop(headers.get("x-real-ip")) ??
    firstHop(headers.get("x-vercel-forwarded-for")) ??
    lastHop(headers.get("x-forwarded-for")) ??
    null
  );
}

async function publicEgressIp(): Promise<string | null> {
  try {
    const response = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!isRecord(body) || typeof body.ip !== "string") return null;
    return body.ip;
  } catch {
    return null;
  }
}

export async function resolveClientIp(headers: Headers): Promise<string> {
  const seen = clientIpFromHeaders(headers);
  if (seen && !isLoopbackOrPrivate(seen)) return seen;
  // No usable platform IP: either a local request (loopback or no headers at
  // all) or a spoofed/internal private address. The egress lookup answers
  // "what IP does this machine leave through", which is only meaningful for
  // the local case — never for a remote private address.
  if (!seen || isLoopback(seen)) {
    const egress = await publicEgressIp();
    if (egress) return egress;
  }
  return seen ?? "0.0.0.0";
}
