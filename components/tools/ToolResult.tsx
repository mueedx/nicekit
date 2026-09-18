export function ToolResult({
  fileName,
  downloadUrl,
  onDownloaded,
}: {
  fileName: string;
  downloadUrl: string;
  onDownloaded?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
      <a
        href={downloadUrl}
        download={fileName}
        onClick={() => onDownloaded?.()}
        className="inline-block rounded-[2px] border border-accent bg-accent-soft px-4 py-2 font-mono text-[12px] tracking-[0.12em] text-accent uppercase transition-colors duration-200 hover:bg-accent hover:text-background"
      >
        Download {fileName}
      </a>
    </div>
  );
}
