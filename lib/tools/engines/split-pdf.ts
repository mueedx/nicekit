import { PDFDocument } from "pdf-lib";
import type { ToolRunContext } from "../types";

export async function splitPdf(ctx: ToolRunContext): Promise<Blob> {
  const { files, onProgress } = ctx;
  if (files.length !== 1) {
    throw new Error("Select one PDF file to split.");
  }

  onProgress?.(10, "Reading PDF…");
  const bytes = await files[0].arrayBuffer();
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = source.getPageCount();

  if (pageCount === 1) {
    onProgress?.(100, "Done");
    return new Blob([bytes], { type: "application/pdf" });
  }

  onProgress?.(40, "Extracting first page…");
  const single = await PDFDocument.create();
  const [page] = await single.copyPages(source, [0]);
  single.addPage(page);
  const out = await single.save();
  onProgress?.(100, "Done");
  return new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
}

/** Split all pages — used when batch queue processes one output per page index. */
export async function splitPdfPage(
  file: File,
  pageIndex: number,
  onProgress?: ToolRunContext["onProgress"],
): Promise<Blob> {
  onProgress?.(10, `Reading page ${pageIndex + 1}…`);
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const single = await PDFDocument.create();
  const [page] = await single.copyPages(source, [pageIndex]);
  single.addPage(page);
  const out = await single.save();
  onProgress?.(100, "Done");
  return new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
}

export async function getPdfPageCount(file: File): Promise<number> {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}
