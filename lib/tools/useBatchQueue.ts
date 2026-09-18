"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QueuedFile } from "./types";

function defaultId(file: File, index: number): string {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export function useBatchQueue() {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const urlsRef = useRef<string[]>([]);

  const trackUrl = useCallback((url: string) => {
    urlsRef.current.push(url);
  }, []);

  useEffect(() => {
    return () => {
      for (const url of urlsRef.current) {
        URL.revokeObjectURL(url);
      }
      urlsRef.current = [];
    };
  }, []);

  const addFiles = useCallback(
    (files: File[], ids?: string[]) => {
      setQueue((prev) => {
        const start = prev.length;
        const next = files.map((file, i) => ({
          id: ids?.[i] ?? defaultId(file, start + i),
          file,
          status: "pending" as const,
        }));
        return [...prev, ...next];
      });
    },
    [],
  );

  const removeFile = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    for (const url of urlsRef.current) {
      URL.revokeObjectURL(url);
    }
    urlsRef.current = [];
    setQueue([]);
    setActiveId(null);
  }, []);

  const markProcessing = useCallback((id: string) => {
    setActiveId(id);
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "processing" } : item,
      ),
    );
  }, []);

  const markDone = useCallback(
    (id: string, resultUrl: string) => {
      trackUrl(resultUrl);
      setActiveId(null);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "done", resultUrl } : item,
        ),
      );
    },
    [trackUrl],
  );

  const markError = useCallback((id: string, error: string) => {
    setActiveId(null);
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "error", error } : item,
      ),
    );
  }, []);

  const nextPending = useCallback((): QueuedFile | null => {
    return queue.find((item) => item.status === "pending") ?? null;
  }, [queue]);

  const isProcessing = activeId !== null;

  return {
    queue,
    activeId,
    isProcessing,
    addFiles,
    removeFile,
    clearQueue,
    markProcessing,
    markDone,
    markError,
    nextPending,
  };
}
