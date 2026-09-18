import Link from "next/link";
import type { ReactNode } from "react";
import { BrandTile, type Brand } from "@/components/BrandMark";
import { Panel } from "@/components/Panel";
import { ScrollReveal } from "@/components/ScrollReveal";

/** One tool entry in a tools grid, used by /tools and /tools/pdf. */
export function ToolCard({
  href,
  brand,
  badge,
  title,
  description,
  extras,
  footer,
}: {
  href: string;
  brand: Brand;
  badge: string;
  title: string;
  description: string;
  extras?: ReactNode;
  footer: string;
}) {
  return (
    <ScrollReveal>
      <Link href={href} className="group block h-full">
        <Panel className="h-full max-w-none">
          <div className="flex h-full flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <BrandTile brand={brand} />
              <span className="label-mono rounded-[2px] border border-border px-2 py-0.5 text-muted ui-transition group-hover:border-accent group-hover:text-accent">
                {badge}
              </span>
            </div>

            <div className="flex-1">
              <p className="font-medium text-foreground">{title}</p>
              <p className="mt-1 text-sm text-muted">{description}</p>
              {extras}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="label-mono text-muted">{footer}</span>
              <span
                aria-hidden
                className="label-mono-sm text-muted ui-transition group-hover:text-accent"
              >
                →
              </span>
            </div>
          </div>
        </Panel>
      </Link>
    </ScrollReveal>
  );
}
