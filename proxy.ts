import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCEPT_CH } from "@/lib/client-hints";
import { resolveClientIp } from "@/lib/client-ip";
import { isCliUserAgent, wantsJson } from "@/lib/ua";

function withClientHints(response: NextResponse): NextResponse {
  response.headers.set("Accept-CH", ACCEPT_CH);
  response.headers.set("Critical-CH", ACCEPT_CH);
  response.headers.append("Vary", ACCEPT_CH);
  return response;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }
  if (isCliUserAgent(request.headers.get("user-agent"))) {
    const ip = await resolveClientIp(request.headers);
    return new NextResponse(`${ip}\n`, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
  if (wantsJson(request.headers.get("accept"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/json";
    return withClientHints(NextResponse.rewrite(url));
  }
  return withClientHints(NextResponse.next());
}

export const config = {
  matcher: "/",
};
