// lib/chat-http.ts - Shared HTTP helper for reading public AI share links.
// Every provider host sits behind some bot protection, so this sends a browser
// UA, distinguishes "not found" from "blocked", and retries the blocked case
// with backoff (the blocks are intermittent).

import { ChatLinkError } from "./chat-errors";

export const SHARE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type FetchShareJsonOptions = {
  /** Provider display name used in error copy, e.g. "DeepSeek". */
  provider: string;
  /** The public share page, sent as Referer so the host trusts the request. */
  referer?: string;
  notFoundMessage?: string;
  blockedMessage?: string;
};

function looksBlocked(body: string): boolean {
  const head = body.trimStart().slice(0, 200).toLowerCase();
  if (!head) return true; // empty body = WAF challenge with no payload
  return (
    head.startsWith("<") || // HTML instead of JSON
    body.includes("Just a moment...") ||
    body.includes("challenges.cloudflare.com") ||
    body.includes("cf-challenge") ||
    body.includes("x-amz-waf-action")
  );
}

function isRetryable(error: unknown): boolean {
  return error instanceof ChatLinkError && (error.code === "blocked" || error.code === "error");
}

/**
 * GETs `url` and returns the parsed JSON body, or throws a ChatLinkError.
 * Retries up to 3 times when the host blocks the request.
 */
export async function fetchShareJson(
  url: string,
  opts: FetchShareJsonOptions,
): Promise<unknown> {
  const { provider } = opts;
  const blockedMessage =
    opts.blockedMessage ??
    `${provider} is blocking automated access right now. The link may still be valid — try again in a few seconds.`;
  const notFoundMessage =
    opts.notFoundMessage ??
    `This ${provider} share link does not exist or has been deleted. Double-check the URL.`;

  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 800));
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": SHARE_UA,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          ...(opts.referer ? { Referer: opts.referer } : {}),
        },
        next: { revalidate: 300 },
      });
    } catch (err) {
      lastError = err;
      if (attempt < 2) continue;
      throw new ChatLinkError("error", `Could not reach ${provider} right now. Try again shortly.`);
    }

    const rawBody = await response.text();

    try {
      if (looksBlocked(rawBody)) {
        throw new ChatLinkError("blocked", blockedMessage);
      }

      if (response.status === 404) {
        throw new ChatLinkError("not_found", notFoundMessage);
      }

      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 429 ||
        response.status === 503
      ) {
        throw new ChatLinkError(
          response.status === 401 ? "private" : "blocked",
          response.status === 401
            ? `This ${provider} chat is not shared publicly. The owner may have revoked access.`
            : blockedMessage,
        );
      }

      if (!response.ok) {
        throw new ChatLinkError(
          "error",
          `Failed to fetch the ${provider} share: HTTP ${response.status}`,
        );
      }

      try {
        return JSON.parse(rawBody);
      } catch {
        throw new ChatLinkError("error", `${provider} returned an unexpected (non-JSON) response.`);
      }
    } catch (err) {
      lastError = err;
      // Not-found and private are definitive; only retry transient blocks.
      if (err instanceof ChatLinkError && (err.code === "not_found" || err.code === "private")) {
        throw err;
      }
      if (attempt >= 2 || !isRetryable(err)) throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ChatLinkError("error", `Failed to fetch the ${provider} share.`);
}
