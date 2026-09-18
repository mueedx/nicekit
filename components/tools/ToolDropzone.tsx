"use client";

import { useCallback, useRef, useState } from "react";
import { isLargeFile, validateFileSize } from "@/lib/tools/categories";

type Props = {
  accept: string;
  acceptLabel: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
};

export function ToolDropzone({
  accept,
  acceptLabel,
  multiple,
  onFiles,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      setError(null);
      const picked = Array.from(list);
      for (const file of picked) {
        const err = validateFileSize(file);
        if (err) {
          setError(err);
          return;
        }
      }
      const large = picked.some(isLargeFile);
      if (large) {
        setError(
          "Large file detected (>100 MB). Conversion may be slow or fail on mobile browsers.",
        );
      }
      onFiles(picked);
    },
    [onFiles],
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`cursor-pointer rounded-[2px] border border-dashed px-5 py-10 text-center ui-transition ${
          dragOver
            ? "border-accent bg-accent-soft"
            : "border-border hover:border-accent hover:bg-accent-soft/40"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <p className="label-mono-sm text-muted">Drop {acceptLabel} here</p>
        <p className="mt-2 text-sm text-muted">or click to browse · max 200 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p className="font-mono text-[12px] text-accent">{error}</p>
      ) : null}
    </div>
  );
}
