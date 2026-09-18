import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionKicker } from "@/components/SectionKicker";
import { ToolCard } from "@/components/tools/ToolCard";
import { TOOL_CATEGORIES } from "@/lib/tools/categories";
import { PDF_TOOLS } from "@/lib/tools/registry";
import type { ToolCategory } from "@/lib/tools/types";

function categoryLabel(category: ToolCategory): string {
  return TOOL_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

export const metadata: Metadata = {
  title: "PDF · Tools · Nicekit",
  description:
    "Merge, split, rotate, and turn images into a PDF — every file is processed in your browser and never uploaded.",
  alternates: { canonical: "/tools/pdf" },
};

export default function PdfToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
      <ScrollReveal>
        <header className="mb-8">
          <SectionKicker number="01" title="Tools · PDF" />
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-[2px] border border-border bg-surface">
              <BrandMark brand="pdf" size={26} />
            </span>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              Four PDF jobs, <span className="text-accent">one tab</span>.
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Merge, split, rotate, and images to PDF. Everything runs in your
            browser — files never leave your machine, max 200 MB per file.
          </p>
          <Link
            href="/tools"
            className="mt-4 inline-block label-mono text-muted ui-transition hover:text-accent"
          >
            ← All tools
          </Link>
        </header>
      </ScrollReveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PDF_TOOLS.map((tool) => (
          <ToolCard
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            brand="pdf"
            badge={categoryLabel(tool.category)}
            title={tool.title}
            description={tool.description}
            footer="browser-only"
          />
        ))}
      </div>

      <p className="mt-8 label-mono text-muted">
        {PDF_TOOLS.length} PDF tools available
      </p>
    </div>
  );
}
