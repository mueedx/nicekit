import { NextResponse } from "next/server";
import { clientIpFromHeaders } from "@/lib/client-ip";
import { isRecord } from "@/lib/parse";
import {
  isValidCategory,
  recordConversion,
  shouldAllowConversion,
} from "@/lib/tools/stats";
import type { ToolCategory } from "@/lib/tools/types";

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  // The Host header is set by the victim's browser to the actual target and
  // cannot be forged cross-site; x-forwarded-host can carry client-supplied
  // values on some deployments, so it is not used for the comparison.
  const host =
    request.headers.get("host") ?? new URL(request.url).host;
  return originHost === host;
}

export async function POST(request: Request) {
  if (!originAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.category !== "string") {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  const category = body.category;
  if (!isValidCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const ip = clientIpFromHeaders(request.headers);
  if (!(await shouldAllowConversion(ip))) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const result = await recordConversion(category as ToolCategory);
  return NextResponse.json({ ok: result.ok });
}
