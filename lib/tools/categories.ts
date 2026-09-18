import type { ToolCategory } from "./types";

export const MAX_FILE_BYTES = 209_715_200; // 200 MB
export const LARGE_FILE_WARN_BYTES = 104_857_600; // 100 MB

export const TOOL_CATEGORIES: {
  id: ToolCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "fetch",
    label: "Fetch",
    description: "Pull and check content from the web",
  },
  {
    id: "organize",
    label: "Organize",
    description: "Merge, split, and rotate PDFs",
  },
  {
    id: "convert",
    label: "Convert",
    description: "Images to PDF and document conversion",
  },
  {
    id: "optimize",
    label: "Optimize",
    description: "Compress and clean up files",
  },
  {
    id: "media",
    label: "Media",
    description: "Audio and video conversion",
  },
  {
    id: "dev",
    label: "Dev",
    description: "Developer utilities",
  },
];

export function isValidCategory(value: string): value is ToolCategory {
  return TOOL_CATEGORIES.some((c) => c.id === value);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateFileSize(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name} exceeds the 200 MB limit (${formatBytes(file.size)}).`;
  }
  return null;
}

export function isLargeFile(file: File): boolean {
  return file.size > LARGE_FILE_WARN_BYTES;
}
