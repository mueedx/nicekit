"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Panel } from "@/components/Panel";
import { SectionKicker } from "@/components/SectionKicker";
import type { ToolDefinition } from "@/lib/tools/types";
import { runTool } from "@/lib/tools/run-tool";
import { beaconConversion } from "@/lib/tools/beacon";
import {
  getPdfPageCount,
  splitPdfPage,
} from "@/lib/tools/engines/split-pdf";
import { useBatchQueue } from "@/lib/tools/useBatchQueue";
import { BatchQueue } from "./BatchQueue";
import { PrivacyBanner } from "./PrivacyBanner";
import { ToolDropzone } from "./ToolDropzone";
import { ToolProgress } from "./ToolProgress";
import { ToolResult } from "./ToolResult";

type SplitMeta = { file: File; pageIndex: number };

export function ToolShell({ tool }: { tool: ToolDefinition }) {
  const batch = useBatchQueue();
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState<string>();
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [lastResult, setLastResult] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const splitMetaRef = useRef<Map<string, SplitMeta>>(new Map());
  const runningRef = useRef(false);

  const outputName = useCallback(
    (input: File, suffix?: string) => {
      const base = input.name.replace(/\.[^.]+$/, "");
      const ext = tool.outputExtension;
      if (suffix) return `${base}-${suffix}.${ext}`;
      if (tool.slug === "merge-pdf") return `merged.${ext}`;
      return `${base}.${ext}`;
    },
    [tool],
  );

  const convert = useCallback(
    async (files: File[], meta?: SplitMeta) => {
      setProgress(0);
      setLastResult(null);

      const onProgress = (value: number, message?: string) => {
        setProgress(value);
        if (message) setProgressMsg(message);
      };

      let blob: Blob;
      if (tool.slug === "split-pdf" && meta) {
        blob = await splitPdfPage(meta.file, meta.pageIndex, onProgress);
      } else if (tool.slug === "rotate-pdf") {
        blob = await runTool(tool, { files, rotation, onProgress });
      } else {
        blob = await runTool(tool, { files, onProgress });
      }

      const name = meta
        ? outputName(meta.file, `page-${meta.pageIndex + 1}`)
        : files.length === 1
          ? outputName(files[0])
          : outputName(files[0], "output");

      const url = URL.createObjectURL(blob);
      setLastResult({ url, name });
      void beaconConversion(tool.category);
      return url;
    },
    [tool, rotation, outputName],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (tool.slug === "split-pdf") {
        for (const file of files) {
          const count = await getPdfPageCount(file);
          const ids: string[] = [];
          for (let i = 0; i < count; i++) {
            const id = `${file.name}-${file.size}-${file.lastModified}-p${i}`;
            ids.push(id);
            splitMetaRef.current.set(id, { file, pageIndex: i });
          }
          batch.addFiles(Array(count).fill(file) as File[], ids);
        }
        return;
      }
      batch.addFiles(files);
    },
    [batch, tool.slug],
  );

  const handleRemove = useCallback(
    (id: string) => {
      splitMetaRef.current.delete(id);
      batch.removeFile(id);
    },
    [batch],
  );

  const runNext = useCallback(async () => {
    if (runningRef.current) return;

    if (tool.slug === "merge-pdf") {
      const pending = batch.queue.filter((q) => q.status === "pending");
      if (pending.length < 2) return;
      runningRef.current = true;
      batch.markProcessing(pending[0].id);
      try {
        const files = pending.map((p) => p.file);
        const url = await convert(files);
        for (const item of pending) {
          batch.markDone(item.id, url);
        }
      } catch (err) {
        for (const item of pending) {
          batch.markError(
            item.id,
            err instanceof Error ? err.message : "Conversion failed",
          );
        }
      } finally {
        runningRef.current = false;
      }
      return;
    }

    if (tool.slug === "images-to-pdf") {
      const pending = batch.queue.filter((q) => q.status === "pending");
      if (pending.length === 0) return;
      runningRef.current = true;
      batch.markProcessing(pending[0].id);
      try {
        const files = pending.map((p) => p.file);
        const url = await convert(files);
        for (const item of pending) {
          batch.markDone(item.id, url);
        }
      } catch (err) {
        for (const item of pending) {
          batch.markError(
            item.id,
            err instanceof Error ? err.message : "Conversion failed",
          );
        }
      } finally {
        runningRef.current = false;
      }
      return;
    }

    const next = batch.nextPending();
    if (!next) return;

    runningRef.current = true;
    batch.markProcessing(next.id);
    try {
      const meta =
        tool.slug === "split-pdf"
          ? splitMetaRef.current.get(next.id)
          : undefined;
      const url = await convert([next.file], meta);
      batch.markDone(next.id, url);
    } catch (err) {
      batch.markError(
        next.id,
        err instanceof Error ? err.message : "Conversion failed",
      );
    } finally {
      splitMetaRef.current.delete(next.id);
      runningRef.current = false;
    }
  }, [batch, convert, tool.slug]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!runningRef.current) void runNext();
    }, 100);
    return () => clearTimeout(t);
  }, [batch.queue, runNext]);

  const canRunMerge =
    tool.slug === "merge-pdf" &&
    batch.queue.filter((q) => q.status === "pending").length >= 2;

  return (
    <div className="py-8 lg:py-12">
      <Panel className="max-w-2xl">
        <header className="border-b border-border px-5 py-6">
          <SectionKicker number="01" title={tool.title} />
          <p className="mt-3 text-sm text-muted">{tool.description}</p>
        </header>

        <section className="space-y-4 px-5 py-6">
          <PrivacyBanner />

          {tool.slug === "rotate-pdf" ? (
            <div className="flex flex-wrap gap-2">
              {([90, 180, 270] as const).map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setRotation(deg)}
                  className={`rounded-[2px] border px-3 py-1 label-mono-sm ui-transition ${
                    rotation === deg
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-muted hover:border-accent"
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          ) : null}

          <ToolDropzone
            accept={tool.accept}
            acceptLabel={tool.acceptLabel}
            multiple={tool.multiple}
            onFiles={(files) => void handleFiles(files)}
            disabled={batch.isProcessing}
          />

          {tool.slug === "merge-pdf" && batch.queue.length === 1 ? (
            <p className="label-mono-sm text-muted">
              Add at least one more PDF to merge.
            </p>
          ) : null}

          <BatchQueue queue={batch.queue} onRemove={handleRemove} />

          {batch.isProcessing || progress > 0 ? (
            <ToolProgress value={progress} message={progressMsg} />
          ) : null}

          {lastResult ? (
            <ToolResult
              fileName={lastResult.name}
              downloadUrl={lastResult.url}
            />
          ) : null}

          {canRunMerge && !batch.isProcessing ? (
            <button
              type="button"
              onClick={() => void runNext()}
              className="rounded-[2px] border border-accent px-4 py-2 label-mono-sm text-accent ui-transition hover:bg-accent-soft"
            >
              Merge now
            </button>
          ) : null}

          {batch.queue.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                splitMetaRef.current.clear();
                batch.clearQueue();
                setLastResult(null);
                setProgress(0);
              }}
              className="label-mono-sm text-muted ui-transition hover:text-accent"
            >
              Clear queue
            </button>
          ) : null}
        </section>
      </Panel>
    </div>
  );
}
