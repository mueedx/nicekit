import { isValidCategory } from "./categories";
import type { ToolCategory } from "./types";

/**
 * Client-safe conversion beacon. Deliberately free of any server-only
 * imports (no @upstash/redis, no process.env) so it can be pulled into
 * client components without dragging the Redis client into the bundle.
 */
export async function beaconConversion(category: ToolCategory): Promise<void> {
  if (!isValidCategory(category)) return;
  try {
    await fetch("/api/tools/stats", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category }),
      keepalive: true,
    });
  } catch {
    // fire-and-forget
  }
}
