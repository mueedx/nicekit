// Minimal ambient declaration for pdf-lib's runtime API. The package's bundled
// .d.ts re-exports from `pdf-lib/src/*`, whose internal root-relative imports
// fail to resolve under TypeScript "bundler" module resolution — so we declare
// only what this repo uses. Runtime behavior is unaffected (real JS is loaded
// from node_modules/pdf-lib/cjs).
declare module "pdf-lib" {
  export interface PDFEmbeddedImage {
    scale(s: number): { width: number; height: number };
  }

  export interface PDFPage {
    setRotation(angle: { angle: number }): void;
    getSize(): { width: number; height: number };
    drawImage(
      image: PDFEmbeddedImage,
      options?: { x?: number; y?: number; width?: number; height?: number },
    ): void;
  }

  export class PDFDocument {
    static create(): Promise<PDFDocument>;
    static load(
      bytes: ArrayBuffer | Uint8Array,
      options?: { ignoreEncryption?: boolean },
    ): Promise<PDFDocument>;
    getPageCount(): number;
    getPageIndices(): number[];
    getPages(): PDFPage[];
    copyPages(source: PDFDocument, indices: number[]): Promise<PDFPage[]>;
    addPage(page?: PDFPage | [number, number]): PDFPage;
    embedJpg(bytes: ArrayBuffer | Uint8Array): Promise<PDFEmbeddedImage>;
    embedPng(bytes: ArrayBuffer | Uint8Array): Promise<PDFEmbeddedImage>;
    save(): Promise<Uint8Array>;
  }

  export function degrees(angle: number): { angle: number; type: "number" };
}
