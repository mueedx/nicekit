// lib/vercel-domain.ts - helpers for the *.vercel.app availability checker

export const VERCEL_APP_NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Normalizes pasted URLs or raw names into a bare subdomain label. */
export function normalizeVercelAppName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\.vercel\.app\/?$/, '')
    .replace(/\/.*$/, '');
}
