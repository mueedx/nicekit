import type { Brand } from "@/components/BrandMark";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionKicker } from "@/components/SectionKicker";
import { ToolCard } from "@/components/tools/ToolCard";
import { CHAT_PROVIDERS } from "@/lib/chat-providers";
import { TOOL_CATEGORIES } from "@/lib/tools/categories";
import {
  FILE_TOOLS,
  getAllToolSlugs,
  PDF_TOOLS,
  WEB_TOOLS,
} from "@/lib/tools/registry";
import { getToolConversionStats } from "@/lib/tools/stats";
import type {
  ConversionStats,
  ToolDefinition,
  WebToolDefinition,
} from "@/lib/tools/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

type AnyTool = ToolDefinition | WebToolDefinition;

function isWebTool(tool: AnyTool): tool is WebToolDefinition {
  return "kind" in tool && tool.kind === "web";
}

/** File tools carry the mark of the format they touch, not a generic sheet. */
const FILE_TOOL_BRANDS: Partial<Record<string, Brand>> = {
  "mp4-to-mp3": "vlc",
};

function brandOf(tool: AnyTool): Brand {
  if (isWebTool(tool)) return (tool.brand ?? "file") as Brand;
  return FILE_TOOL_BRANDS[tool.slug] ?? "file";
}

function categoryLabel(category: AnyTool["category"]): string {
  return TOOL_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

/** The PDF category totals are the merge/split/rotate/images cards combined. */
function pdfConverted(stats: ConversionStats): number {
  return (stats.byCategory.organize ?? 0) + (stats.byCategory.convert ?? 0);
}

type GridEntry =
  | { kind: "whoami" }
  | { kind: "tool"; tool: AnyTool }
  | { kind: "pdf" };

/** The card first, then every tool — all on the first page. */
const GRID: GridEntry[] = [
  { kind: "whoami" },
  ...WEB_TOOLS.map((tool): GridEntry => ({ kind: "tool", tool })),
  { kind: "pdf" },
  ...FILE_TOOLS.map((tool): GridEntry => ({ kind: "tool", tool })),
];

/** The merged AI chat tool shows every provider it can read. */
const CHAT_BRANDS = CHAT_PROVIDERS.map((p) => p.id) as Brand[];

export default async function HomePage() {
  const stats = await getToolConversionStats();
  const total = getAllToolSlugs().length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
      <ScrollReveal>
        <header className="mb-8">
          <SectionKicker number="00" title="Home" />
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-foreground">
            You, plus <span className="text-accent">every tool</span>.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Start with the who-am-I card for your public IP, speed, origin and
            weather, then reach every file and web tool — {total} tools in all.
            Files never leave your machine; max 200 MB per file.
          </p>
          {stats.total !== null ? (
            <p className="mt-3 label-mono-sm text-muted">
              {formatCount(stats.total)} files converted site-wide
            </p>
          ) : null}
        </header>
      </ScrollReveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GRID.map((entry) => {
          if (entry.kind === "whoami") {
            return (
              <ToolCard
                key="whoami"
                href="/whoami"
                brand="whoami"
                badge="Diagnostic"
                title="Who am I?"
                description="Your public IP, a Cloudflare speed test, origin, weather, VPN guess, DNS resolver and browser — every row a live measurement against your exit path."
                footer="live · browser + server"
              />
            );
          }

          if (entry.kind === "pdf") {
            const count = pdfConverted(stats);
            return (
              <ToolCard
                key="pdf"
                href="/tools/pdf"
                brand="pdf"
                badge="PDF"
                title="PDF"
                description="Merge, split, rotate, and turn images into a PDF — all in the browser."
                footer={
                  count > 0
                    ? `${formatCount(count)} converted`
                    : `${PDF_TOOLS.length} tools`
                }
                extras={
                  <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 label-mono text-muted">
                    {PDF_TOOLS.map((tool) => (
                      <li key={tool.slug}>{tool.title}</li>
                    ))}
                  </ul>
                }
              />
            );
          }

          const { tool } = entry;
          const count = isWebTool(tool)
            ? undefined
            : stats.byCategory[tool.category];
          const brands = tool.slug === "chat-export" ? CHAT_BRANDS : undefined;

          return (
            <ToolCard
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              brand={brandOf(tool)}
              brands={brands}
              badge={categoryLabel(tool.category)}
              title={tool.title}
              description={tool.description}
              footer={
                count !== undefined && count > 0
                  ? `${formatCount(count)} converted`
                  : isWebTool(tool)
                    ? "live · server"
                    : "browser-only"
              }
            />
          );
        })}
      </div>

      <p className="mt-8 label-mono text-muted">{total} tools available</p>
    </div>
  );
}

