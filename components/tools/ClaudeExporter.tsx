"use client";

import { useRef, useState } from "react";
import { Panel } from "@/components/Panel";

type ChatMeta = {
  uuid: string;
  shareUrl: string;
  name: string;
  messageCount: number;
  preview: string;
};

const FORMATS = ["md", "txt", "docx", "pdf"] as const;
const FORMAT_DESC: Record<(typeof FORMATS)[number], string> = {
  md: "Markdown",
  txt: "Plain text",
  docx: "Word document",
  pdf: "PDF document",
};

export function ClaudeExporter() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [meta, setMeta] = useState<ChatMeta | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  async function inspect(target?: string) {
    const input = (target ?? url).trim();
    if (!input) {
      setError({ message: "Paste a claude.ai/share link first.", code: "invalid_url" });
      return;
    }
    setLoading(true);
    setError(null);
    setMeta(null);

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to read the Claude chat.");
      }
      setMeta(json.data);
      setTimeout(() => headingRef.current?.focus(), 50);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Failed to connect to Claude.",
        code: "blocked",
      });
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
            void inspect();
          }}
        >
          <label className="label-mono-sm text-muted" htmlFor="claude-url">
            Claude share link
          </label>
          <div className="mt-2 flex items-stretch gap-2 max-sm:flex-col">
            <input
              id="claude-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              placeholder="https://claude.ai/share/..."
              spellCheck={false}
              autoComplete="off"
              className="w-full flex-1 rounded-[2px] border border-border bg-background px-3.5 py-2.5 font-mono text-sm text-foreground outline-none ui-transition placeholder:font-sans placeholder:opacity-75 focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-[2px] border border-accent bg-accent px-5 py-2.5 font-mono text-xs tracking-widest whitespace-nowrap text-background uppercase ui-transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Reading…" : "Read Chat"}
            </button>
          </div>
        </form>
      </Panel>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-3 rounded-[2px] border border-red-500/45 bg-red-500/8 px-4 py-3 font-mono text-xs text-red-500"
        >
          <span>{error.message}</span>
          {(error.code === "blocked" ||
            error.code === "not_found" ||
            error.code === "private") && (
            <button
              type="button"
              onClick={() => void inspect(url)}
              className="ml-auto shrink-0 text-accent uppercase underline-offset-2 ui-transition hover:underline"
            >
              try again
            </button>
          )}
        </div>
      )}

      {loading && (
        <Panel className="max-w-none">
          <div className="flex gap-5 p-5" aria-hidden>
            <div className="h-32 w-full animate-pulse rounded-[2px] bg-border" />
          </div>
          <p className="border-t border-border px-5 py-3 label-mono text-muted">
            Reading Claude chat…
          </p>
        </Panel>
      )}

      {meta && (
        <>
          <Panel className="max-w-none">
            <div className="p-5">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-lg font-medium text-foreground outline-none"
              >
                {meta.name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="label-mono-sm rounded-[2px] border border-border px-2.5 py-1 text-muted">
                  {meta.messageCount} messages
                </span>
                <span className="label-mono-sm rounded-[2px] border border-accent bg-accent-soft px-2.5 py-1 text-accent">
                  ✓ public · readable
                </span>
              </div>
              <a
                href={meta.shareUrl}
                target="_blank"
                rel="noreferrer"
                className="label-mono-sm mt-3 inline-block text-muted ui-transition hover:text-accent"
              >
                {meta.shareUrl} ↗
              </a>
            </div>
          </Panel>

          <div>
            <h2 className="kicker">
              <span className="text-accent">02</span>
              <span className="mx-2 text-border">/</span>
              export conversation
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {FORMATS.map((fmt) => (
                <Panel key={fmt} className="max-w-none">
                  <div className="flex flex-col justify-between gap-4 p-4">
                    <div>
                      <p className="font-mono text-sm font-semibold uppercase text-foreground">
                        .{fmt}
                      </p>
                      <p className="label-mono mt-1 text-muted">
                        {FORMAT_DESC[fmt]}
                      </p>
                    </div>
                    <a
                      href={`/api/claude/export?url=${encodeURIComponent(meta.shareUrl)}&format=${fmt}`}
                      download
                      className="rounded-[2px] border border-accent bg-accent px-4 py-2 text-center font-mono text-xs tracking-widest text-background uppercase ui-transition hover:bg-transparent hover:text-accent"
                    >
                      Download
                    </a>
                  </div>
                </Panel>
              ))}
            </div>
          </div>

          {meta.preview && (
            <Panel className="max-w-none">
              <div className="border-b border-border px-5 py-3">
                <p className="label-mono text-foreground">Conversation preview</p>
              </div>
              <div
                aria-live="polite"
                className="max-h-80 overflow-y-auto p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted"
              >
                {meta.preview}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
