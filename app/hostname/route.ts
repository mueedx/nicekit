import { promises as dns } from "node:dns";
import { resolveClientIp } from "@/lib/client-ip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = await resolveClientIp(request.headers);
  let name = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const names = await Promise.race([
      dns.reverse(ip),
      new Promise<string[]>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), 1500);
      }),
    ]);
    name = names[0] ?? "";
  } catch {
    name = "";
  } finally {
    if (timer) clearTimeout(timer);
  }
  return new Response(name, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
