"use client";

import { useRef, useState } from "react";
import { Panel } from "@/components/Panel";
import { extractLoomId, type LoomMetadata } from "@/lib/loom/loom";

type Tab = "video" | "transcript" | "assets";

function formatDuration(secs: number): string {
  if (!secs) return "0:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function LoomDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<LoomMetadata | null>(null);
  const [tab, setTab] = useState<Tab>("video");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  async function inspect(input?: string) {
    const target = (input ?? url).trim();
    if (!target) {
      setError("Paste a Loom share link first.");
      return;
    }
    const id = extractLoomId(target);
    if (!id) {
      setError("Not a valid Loom link. Expected https://www.loom.com/share/…");
      return;
    }
    setLoading(true);
    setError(null);
    setMetadata(null);
    setTranscript(null);

    try {
      const res = await fetch("/api/loom/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to inspect Loom video.");
      }
      setMetadata(json.data);
      setTab("video");
      if (json.data.hasTranscript && json.data.transcriptUrl) {
        fetch(
          `/api/loom/transcript?url=${encodeURIComponent(json.data.transcriptUrl)}&format=txt`,
        )
          .then((r) => (r.ok ? r.text() : null))
          .then((t) => t && setTranscript(t))
          .catch(() => {});
      }
      setTimeout(() => headingRef.current?.focus(), 50);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to Loom.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyTranscript() {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  const enc = encodeURIComponent;

  const meta = metadata;

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
          <label className="label-mono-sm text-muted" htmlFor="loom-url">
            Loom share link
          </label>
          <div className="mt-2 flex items-stretch gap-2 max-sm:flex-col">
            <input
              id="loom-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              placeholder="https://www.loom.com/share/..."
              spellCheck={false}
              autoComplete="off"
              className="w-full flex-1 rounded-[2px] border border-border bg-background px-3.5 py-2.5 font-mono text-sm text-foreground outline-none ui-transition placeholder:font-sans placeholder:opacity-75 focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-[2px] border border-accent bg-accent px-5 py-2.5 font-mono text-xs tracking-widest whitespace-nowrap text-background uppercase ui-transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Fetching…" : "Fetch Video"}
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

      {meta && (
        <>
          <Panel className="max-w-none">
            <div className="grid gap-5 p-5 sm:grid-cols-[240px_1fr] max-sm:grid-cols-1">
              <div className="relative aspect-video overflow-hidden rounded-[2px] border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={meta.thumbnailUrl}
                  alt={meta.title}
                  className="h-full w-full object-cover"
                />
                {meta.duration > 0 && (
                  <span className="absolute right-2 bottom-2 rounded-[2px] border border-border bg-background/70 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-foreground uppercase">
                    {formatDuration(meta.duration)}
                  </span>
                )}
              </div>
              <div>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-lg font-medium text-foreground outline-none"
                >
                  {meta.title}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="label-mono-sm rounded-[2px] border border-border px-2.5 py-1 text-muted">
                    {formatDuration(meta.duration)}
                  </span>
                  {meta.hasTranscript && (
                    <span className="label-mono-sm rounded-[2px] border border-accent bg-accent-soft px-2.5 py-1 text-accent">
                      ✓ transcript available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["video", `Video (${meta.downloadOptions.length})`],
                ...(meta.hasTranscript ? ([["transcript", "Transcript"]] as const) : []),
                ["assets", "Assets"],
              ] as Array<[Tab, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
                className={`rounded-[2px] border px-4 py-2 font-mono text-xs tracking-wider uppercase ui-transition ${
                  tab === id
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted hover:border-accent hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "video" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {meta.downloadOptions.map((opt, i) => {
                const filename = `${meta.title || "loom-video"}-${opt.quality}.mp4`;
                return (
                  <Panel key={i} className="max-w-none">
                    <div className="flex flex-col justify-between gap-4 p-4">
                      <div>
                        <p className="font-mono text-sm font-semibold uppercase text-foreground">
                          {opt.quality}
                        </p>
                        <p className="label-mono mt-1 text-muted">
                          MP4 video format
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a
                          href={opt.url}
                          target="_blank"
                          rel="noreferrer"
                          download={filename}
                          className="rounded-[2px] border border-accent bg-accent px-4 py-2 text-center font-mono text-xs tracking-widest text-background uppercase ui-transition hover:bg-transparent hover:text-accent"
                        >
                          Direct download
                        </a>
                        <a
                          href={`/api/loom/stream?url=${enc(opt.url)}&filename=${enc(filename)}`}
                          download={filename}
                          title="Proxy download if the direct download is blocked by the browser"
                          className="rounded-[2px] border border-border px-4 py-2 text-center font-mono text-xs tracking-widest uppercase ui-transition hover:border-accent hover:text-accent"
                        >
                          Proxy stream
                        </a>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}

          {tab === "transcript" && meta.transcriptUrl && (
            <Panel className="max-w-none">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
                <p className="label-mono text-foreground">Text transcript</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyTranscript()}
                    className="rounded-[2px] border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase ui-transition hover:border-accent hover:text-accent"
                  >
                    {copied ? "✓ Copied" : "Copy text"}
                  </button>
                  <a
                    href={`/api/loom/transcript?url=${enc(meta.transcriptUrl)}&format=srt&title=${enc(meta.title)}`}
                    download={`${meta.title}.srt`}
                    className="rounded-[2px] border border-accent bg-accent px-4 py-2 font-mono text-xs tracking-widest text-background uppercase ui-transition hover:bg-transparent hover:text-accent"
                  >
                    Download .SRT
                  </a>
                  <a
                    href={`/api/loom/transcript?url=${enc(meta.transcriptUrl)}&format=txt&title=${enc(meta.title)}`}
                    download={`${meta.title}.txt`}
                    className="rounded-[2px] border border-border px-4 py-2 font-mono text-xs tracking-widest uppercase ui-transition hover:border-accent hover:text-accent"
                  >
                    Download .TXT
                  </a>
                </div>
              </div>
              <div
                aria-live="polite"
                className="max-h-80 overflow-y-auto p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted"
              >
                {transcript ||
                  "Transcript available for download using the buttons above."}
              </div>
            </Panel>
          )}

          {tab === "assets" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Panel className="max-w-none">
                <div className="flex flex-col justify-between gap-4 p-4">
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meta.thumbnailUrl}
                      alt="Poster cover"
                      loading="lazy"
                      className="mb-3 aspect-video w-full rounded-[2px] border border-border object-cover"
                    />
                    <p className="font-mono text-sm font-semibold uppercase text-foreground">
                      Poster cover
                    </p>
                    <p className="label-mono mt-1 text-muted">
                      High resolution JPG
                    </p>
                  </div>
                  <a
                    href={meta.thumbnailUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={`${meta.title}-cover.jpg`}
                    className="rounded-[2px] border border-accent bg-accent px-4 py-2 text-center font-mono text-xs tracking-widest text-background uppercase ui-transition hover:bg-transparent hover:text-accent"
                  >
                    Download JPG
                  </a>
                </div>
              </Panel>

              <Panel className="max-w-none">
                <div className="flex flex-col justify-between gap-4 p-4">
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meta.thumbnailGifUrl}
                      alt="Animated GIF preview"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                      className="mb-3 aspect-video w-full rounded-[2px] border border-border object-cover"
                    />
                    <p className="font-mono text-sm font-semibold uppercase text-foreground">
                      Animated preview
                    </p>
                    <p className="label-mono mt-1 text-muted">Looping GIF</p>
                  </div>
                  <a
                    href={meta.thumbnailGifUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={`${meta.title}-preview.gif`}
                    className="rounded-[2px] border border-accent bg-accent px-4 py-2 text-center font-mono text-xs tracking-widest text-background uppercase ui-transition hover:bg-transparent hover:text-accent"
                  >
                    Download GIF
                  </a>
                </div>
              </Panel>
            </div>
          )}
        </>
      )}
    </div>
  );
}

