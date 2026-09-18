import { PDFDocument } from "pdf-lib";
import type { ToolRunContext } from "../types";

export async function mergePdf(ctx: ToolRunContext): Promise<Blob> {
  const { files, onProgress } = ctx;
  if (files.length < 2) {
    throw new Error("Select at least two PDF files to merge.");
  }

  onProgress?.(5, "Reading PDFs…");
  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const bytes = await files[i].arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
    onProgress?.(
      Math.round(((i + 1) / files.length) * 85),
      `Merged ${i + 1} of ${files.length}…`,
    );
  }

  onProgress?.(95, "Saving…");
  const out = await merged.save();
  onProgress?.(100, "Done");
  return new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
}
