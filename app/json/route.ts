import { loadVisitor, visitorJson } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const visitor = await loadVisitor(request.headers);
  return new Response(visitorJson(visitor), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
