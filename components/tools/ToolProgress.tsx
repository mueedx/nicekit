export function ToolProgress({
  value,
  message,
}: {
  value: number;
  message?: string;
}) {
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex justify-between label-mono-sm text-muted">
        <span>{message ?? "Processing…"}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-[2px] bg-border">
        <div
          className="h-full bg-accent transition-[width] duration-200 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
