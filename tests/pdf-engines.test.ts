import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { mergePdf } from "@/lib/tools/engines/merge-pdf";
import { splitPdf, getPdfPageCount } from "@/lib/tools/engines/split-pdf";
import { rotatePdf } from "@/lib/tools/engines/rotate-pdf";

describe("PDF engines and pdf-lib runtime", () => {
  it("PDFDocument.create creates a valid PDF document", async () => {
    const doc = await PDFDocument.create();
    expect(doc).toBeDefined();
    doc.addPage([200, 200]);
    const bytes = await doc.save();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
    // PDF signature check
    const header = String.fromCharCode(...bytes.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("mergePdf combines multiple PDF files", async () => {
    const doc1 = await PDFDocument.create();
    doc1.addPage([100, 100]);
    const bytes1 = await doc1.save();

    const doc2 = await PDFDocument.create();
    doc2.addPage([200, 200]);
    const bytes2 = await doc2.save();

    const file1 = new File([bytes1.buffer as ArrayBuffer], "doc1.pdf", { type: "application/pdf" });
    const file2 = new File([bytes2.buffer as ArrayBuffer], "doc2.pdf", { type: "application/pdf" });

    const mergedBlob = await mergePdf({
      files: [file1, file2],
    });

    expect(mergedBlob.type).toBe("application/pdf");
    const mergedFile = new File([mergedBlob], "merged.pdf", { type: "application/pdf" });
    const count = await getPdfPageCount(mergedFile);
    expect(count).toBe(2);
  });

  it("splitPdf and rotatePdf work properly", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    doc.addPage([100, 100]);
    const bytes = await doc.save();
    const file = new File([bytes.buffer as ArrayBuffer], "two-pages.pdf", { type: "application/pdf" });

    const splitBlob = await splitPdf({ files: [file] });
    const splitFile = new File([splitBlob], "page1.pdf", { type: "application/pdf" });
    const splitCount = await getPdfPageCount(splitFile);
    expect(splitCount).toBe(1);

    const rotatedBlob = await rotatePdf({
      files: [file],
      rotation: 90,
    });
    expect(rotatedBlob.type).toBe("application/pdf");
    expect(rotatedBlob.size).toBeGreaterThan(0);
  });
});
