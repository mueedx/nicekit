import type { ToolDefinition, WebToolDefinition } from "./types";

export const TOOLS: ToolDefinition[] = [
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    description: "Combine multiple PDFs into one document.",
    category: "organize",
    engine: "client",
    accept: "application/pdf",
    acceptLabel: "PDF",
    multiple: true,
    outputExtension: "pdf",
    outputMime: "application/pdf",
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    description: "Extract each page into its own PDF file.",
    category: "organize",
    engine: "client",
    accept: "application/pdf",
    acceptLabel: "PDF",
    multiple: false,
    outputExtension: "pdf",
    outputMime: "application/pdf",
  },
  {
    slug: "rotate-pdf",
    title: "Rotate PDF",
    description: "Rotate all pages by 90°, 180°, or 270°.",
    category: "organize",
    engine: "client",
    accept: "application/pdf",
    acceptLabel: "PDF",
    multiple: false,
    outputExtension: "pdf",
    outputMime: "application/pdf",
  },
  {
    slug: "images-to-pdf",
    title: "Images to PDF",
    description: "Convert JPG, PNG, or WebP images into a single PDF.",
    category: "convert",
    engine: "client",
    accept: "image/jpeg,image/png,image/webp",
    acceptLabel: "JPG, PNG, WebP",
    multiple: true,
    outputExtension: "pdf",
    outputMime: "application/pdf",
  },
  {
    slug: "mp4-to-mp3",
    title: "MP4 to MP3",
    description: "Extract audio from an MP4 video as MP3.",
    category: "media",
    engine: "client",
    accept: "video/mp4,video/quicktime,.mp4",
    acceptLabel: "MP4",
    multiple: false,
    outputExtension: "mp3",
    outputMime: "audio/mpeg",
  },
];

export const WEB_TOOLS: WebToolDefinition[] = [
  {
    slug: "loom-download",
    title: "Loom Downloader",
    description:
      "Download a Loom video (HD MP4), transcripts (SRT/TXT) and preview assets from any share link.",
    category: "fetch",
    kind: "web",
    brand: "loom",
  },
  {
    slug: "claude-export",
    title: "Claude Chat Export",
    description:
      "Read a public claude.ai/share conversation and export it as Markdown, TXT, DOCX or PDF.",
    category: "fetch",
    kind: "web",
    brand: "claude",
  },
  {
    slug: "vercel-domain",
    title: "Vercel Domain Checker",
    description:
      "Check whether a *.vercel.app subdomain is available for your next deployment.",
    category: "fetch",
    kind: "web",
    brand: "vercel",
  },
];

export function isFileTool(tool: ToolDefinition): boolean {
  return true;
}

/** PDF utilities are grouped behind one card on /tools and one tab at /tools/pdf. */
export const PDF_TOOL_SLUGS = [
  "merge-pdf",
  "split-pdf",
  "rotate-pdf",
  "images-to-pdf",
];

export const PDF_TOOLS: ToolDefinition[] = TOOLS.filter((tool) =>
  PDF_TOOL_SLUGS.includes(tool.slug),
);

/** File tools that keep their own card on /tools. */
export const FILE_TOOLS: ToolDefinition[] = TOOLS.filter(
  (tool) => !PDF_TOOL_SLUGS.includes(tool.slug),
);

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getWebToolBySlug(slug: string): WebToolDefinition | undefined {
  return WEB_TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolDefinition["category"]) {
  return TOOLS.filter((t) => t.category === category);
}

export function getWebToolsByCategory(
  category: WebToolDefinition["category"],
): WebToolDefinition[] {
  return WEB_TOOLS.filter((t) => t.category === category);
}

export function getAllToolSlugs(): string[] {
  return [...TOOLS.map((t) => t.slug), ...WEB_TOOLS.map((t) => t.slug)];
}
