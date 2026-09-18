import type { ReactNode } from "react";

export const dash = "—";

export function Pulse({ className }: { className: string }) {
  return (
    <span
      className={`inline-block rounded-[2px] bg-border align-middle motion-safe:animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export function FactGrid({ children }: { children: ReactNode }) {
  return <dl className="mt-5 grid grid-cols-2 gap-3">{children}</dl>;
}

export function FactBox({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[2px] border border-border bg-surface px-3 py-3 ui-transition hover:border-accent/60">
      <dt className="label-mono-sm text-muted">{label}</dt>
      <dd
        dir="auto"
        className="mt-1 min-w-0 text-balance break-words text-base text-foreground"
      >
        {children}
      </dd>
    </div>
  );
}
