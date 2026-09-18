export type ToolCategory =
  | "organize"
  | "convert"
  | "optimize"
  | "media"
  | "dev"
  | "fetch";

export type ToolEngine = "client";

export type ToolDefinition = {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  engine: ToolEngine;
  accept: string;
  acceptLabel: string;
  multiple: boolean;
  outputExtension: string;
  outputMime: string;
};

/** Server-backed tools that render their own page instead of ToolShell. */
export type WebToolDefinition = {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  kind: "web";
  brand?: "vercel" | "loom" | "claude";
};

export type ToolRunContext = {
  files: File[];
  rotation?: 90 | 180 | 270;
  onProgress?: (value: number, message?: string) => void;
};

export type ToolRunner = (ctx: ToolRunContext) => Promise<Blob>;

export type QueuedFile = {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
  resultUrl?: string;
};

export type ConversionStats = {
  byCategory: Partial<Record<ToolCategory, number>>;
  total: number | null;
};
