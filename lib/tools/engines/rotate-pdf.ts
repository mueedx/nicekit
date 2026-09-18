import { PDFDocument, degrees } from "pdf-lib";
import type { ToolRunContext } from "../types";

export async function rotatePdf(ctx: ToolRunContext): Promise<Blob> {
  const { files, rotation = 90, onProgress } = ctx;
  if (files.length !== 1) {
    throw new Error("Select one PDF file to rotate.");
  }

  onProgress?.(10, "Reading PDF…");
  const bytes = await files[0].arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const angle = degrees(rotation);

  for (const page of doc.getPages()) {
    page.setRotation(angle);
  }

  onProgress?.(80, "Saving…");
  const out = await doc.save();
  onProgress?.(100, "Done");
  return new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
}
