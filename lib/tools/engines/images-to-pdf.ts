import { PDFDocument } from "pdf-lib";
import type { ToolRunContext } from "../types";

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function loadImageBytes(file: File): Promise<{
  bytes: ArrayBuffer;
  mime: "png" | "jpg";
  width: number;
  height: number;
}> {
  if (file.type === "image/webp") {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("WebP convert failed"))), "image/png");
    });
    const bytes = await blob.arrayBuffer();
    return { bytes, mime: "png", width: canvas.width, height: canvas.height };
  }

  const bytes = await file.arrayBuffer();
  const mime = file.type === "image/png" ? "png" : "jpg";
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  bitmap.close();
  return { bytes, mime, width, height };
}

export async function imagesToPdf(ctx: ToolRunContext): Promise<Blob> {
  const { files, onProgress } = ctx;
  const images = files.filter((f) => IMAGE_MIMES.has(f.type));
  if (images.length === 0) {
    throw new Error("Select at least one JPG, PNG, or WebP image.");
  }

  onProgress?.(5, "Creating PDF…");
  const pdf = await PDFDocument.create();

  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    onProgress?.(
      Math.round(((i + 1) / images.length) * 80),
      `Adding image ${i + 1} of ${images.length}…`,
    );

    const { bytes, mime, width, height } = await loadImageBytes(file);
    const img =
      mime === "png"
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);

    const page = pdf.addPage([width, height]);
    page.drawImage(img, { x: 0, y: 0, width, height });
  }

  onProgress?.(95, "Saving…");
  const out = await pdf.save();
  onProgress?.(100, "Done");
  return new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
}
