import type { QueuedFile } from "@/lib/tools/types";
import { formatBytes } from "@/lib/tools/categories";

export function BatchQueue({
  queue,
  onRemove,
}: {
  queue: QueuedFile[];
  onRemove: (id: string) => void;
}) {
  if (queue.length === 0) return null;

  return (
    <ul className="space-y-2 border-t border-border pt-4">
      {queue.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-[2px] border border-border px-3 py-2 font-mono text-[12px]"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-foreground">{item.file.name}</p>
            <p className="text-muted">{formatBytes(item.file.size)} · {item.status}</p>
            {item.error ? (
              <p className="text-accent">{item.error}</p>
            ) : null}
          </div>
          {item.status === "pending" ? (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="shrink-0 text-muted transition-colors duration-200 hover:text-accent"
            >
              Remove
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
