import type { ToolDefinition, ToolRunContext } from "./types";

export async function runMergePdf(ctx: ToolRunContext): Promise<Blob> {
  const { mergePdf } = await import("./engines/merge-pdf");
  return mergePdf(ctx);
}

export async function runSplitPdf(ctx: ToolRunContext): Promise<Blob> {
  const { splitPdf } = await import("./engines/split-pdf");
  return splitPdf(ctx);
}

export async function runRotatePdf(ctx: ToolRunContext): Promise<Blob> {
  const { rotatePdf } = await import("./engines/rotate-pdf");
  return rotatePdf(ctx);
}

export async function runImagesToPdf(ctx: ToolRunContext): Promise<Blob> {
  const { imagesToPdf } = await import("./engines/images-to-pdf");
  return imagesToPdf(ctx);
}

export async function runMp4ToMp3(ctx: ToolRunContext): Promise<Blob> {
  const { mp4ToMp3 } = await import("./engines/mp4-to-mp3");
  return mp4ToMp3(ctx);
}

export async function runTool(
  tool: ToolDefinition,
  ctx: ToolRunContext,
): Promise<Blob> {
  switch (tool.slug) {
    case "merge-pdf":
      return runMergePdf(ctx);
    case "split-pdf":
      return runSplitPdf(ctx);
    case "rotate-pdf":
      return runRotatePdf(ctx);
    case "images-to-pdf":
      return runImagesToPdf(ctx);
    case "mp4-to-mp3":
      return runMp4ToMp3(ctx);
    default:
      throw new Error(`No engine registered for ${tool.slug}`);
  }
}
