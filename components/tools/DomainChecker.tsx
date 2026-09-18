"use client";

import { useRef, useState } from "react";
import { Panel } from "@/components/Panel";
import { normalizeVercelAppName } from "@/lib/vercel-domain";

type DomainResult = {
  name: string;
  checkedUrl: string;
  available: boolean;
  status: number;
};

type Suggestion = { name: string; available: boolean };

export function DomainChecker() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DomainResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  async function check(raw?: string) {
    const target = (raw ?? name).trim();
    if (!target) {
      setError("Enter an app name to check.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setSuggestions(null);

    try {
      const res = await fetch(
        `/api/vercel-domain?name=${encodeURIComponent(target)}`,
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Could not check the domain.");
      }
      setResult(json.data);

      if (!json.data.available) {
        const base = json.data.name;
        const alternates = [`${base}-app`, `${base}-hq`, `get-${base}`].filter(
          (n) => n.length <= 63,
        );
        const checks = await Promise.all(
          alternates.map(async (n) => {
            try {
              const r = await fetch(
                `/api/vercel-domain?name=${encodeURIComponent(n)}`,
              );
              const j = await r.json();
              return j?.success
                ? { name: n, available: Boolean(j.data.available) }
                : null;
            } catch {
              return null;
            }
          }),
        );
        setSuggestions(
          checks.filter(
            (c): c is { name: string; available: boolean } => c !== null,
          ),
        );
      }
      setTimeout(() => headingRef.current?.focus(), 50);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check the domain.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel className="max-w-none">
        <form
          className="p-5"
          aria-busy={loading}
          onSubmit={(e) => {
            e.preventDefault();
            void check();
          }}
        >
          <label className="label-mono-sm text-muted" htmlFor="vercel-name">
            App name
          </label>
          <div className="mt-2 flex items-stretch gap-2 max-sm:flex-col">
            <div className="relative flex flex-1 items-center">
              <input
                id="vercel-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                  setResult(null);
                  setSuggestions(null);
                }}
                disabled={loading}
                placeholder="my-app"
                spellCheck={false}
                autoComplete="off"
                className="w-full rounded-[2px] border border-border bg-background py-2.5 pr-24 pl-3.5 font-mono text-sm text-foreground outline-none ui-transition placeholder:font-sans placeholder:opacity-75 focus:border-accent"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute right-3 rounded-[2px] border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted"
              >
                .vercel.app
              </span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-[2px] border border-accent bg-accent px-5 py-2.5 font-mono text-xs tracking-widest text-background uppercase ui-transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Checking…" : "Check"}
            </button>
          </div>
        </form>
      </Panel>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-[2px] border border-red-500/45 bg-red-500/8 px-4 py-3 font-mono text-xs text-red-500"
        >
          {error}
        </div>
      )}

      {result && (
        <Panel className="max-w-none">
          <div className="p-5">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-mono text-lg font-medium break-all text-foreground outline-none"
            >
              {result.checkedUrl}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`label-mono-sm rounded-[2px] border px-2.5 py-1 ${
                  result.available
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted"
                }`}
              >
                {result.available ? "✓ available" : "❌ taken"}
              </span>
              <span className="label-mono-sm rounded-[2px] border border-border px-2.5 py-1 text-muted">
                live check · http {result.available ? "404" : result.status}
              </span>
            </div>
            <p className="mt-3 max-w-xl text-sm text-muted">
              {result.available
                ? "This subdomain looks free. Visit the URL while signed in to Vercel to claim it for your next deployment."
                : "This subdomain is already in use. Alternatives:"}
            </p>
          </div>
        </Panel>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {suggestions.map((s) => (
            <Panel key={s.name} className="max-w-none">
              <div className="flex flex-col justify-between gap-4 p-4">
                <div>
                  <p className="font-mono text-sm font-semibold break-all text-foreground">
                    {s.name}
                  </p>
                  <p className="label-mono mt-1 text-muted">.vercel.app</p>
                </div>
                <div className="flex flex-col gap-2">
                  <span
                    className={`label-mono-sm rounded-[2px] border px-2.5 py-1 ${
                      s.available
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-muted"
                    }`}
                  >
                    {s.available ? "✓ available" : "❌ taken"}
                  </span>
                  {s.available && (
                    <button
                      type="button"
                      onClick={() => {
                        setName(s.name);
                        void check(s.name);
                      }}
                      className="rounded-[2px] border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase ui-transition hover:border-accent hover:text-accent"
                    >
                      Details
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
