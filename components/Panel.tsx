import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative mx-auto w-full max-w-2xl ${className}`.trim()}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 translate-x-2 translate-y-2 rounded-[2px] bg-accent-soft"
      />
      <article className="relative flex h-full flex-col rounded-[2px] border border-border bg-surface ui-transition hover:border-accent">
        {children}
      </article>
    </div>
  );
}
