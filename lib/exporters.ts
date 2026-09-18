// lib/exporters.ts - Zero-dependency DOCX (OOXML zip) and PDF writers for Claude chats
import { chatToSections, type ClaudeChat } from "./claude";

/* =====================================================================
   Minimal ZIP (STORE method, no compression) for DOCX generation
   ===================================================================== */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Builds a ZIP archive from {name, data} entries using STORE (no compression). */
function buildZip(entries: Array<{ name: string; data: string | Uint8Array }>): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  const u16 = (v: number) => [v & 0xff, (v >> 8) & 0xff];
  const u32 = (v: number) => [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff];

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const crc = crc32(dataBytes);

    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(dataBytes.length), ...u32(dataBytes.length),
      ...u16(nameBytes.length), ...u16(0), ...nameBytes, ...dataBytes,
    ]);
    chunks.push(local);

    central.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(dataBytes.length), ...u32(dataBytes.length),
      ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0),
      ...u32(offset), ...nameBytes,
    ]));

    offset += local.length;
  }

  const centralDirSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length),
    ...u32(centralDirSize), ...u32(offset), ...u16(0),
  ]);

  const total = offset + centralDirSize + end.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of [...chunks, ...central, end]) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

/* =====================================================================
   DOCX generation
   ===================================================================== */

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function docxParagraph(text: string, opts: { bold?: boolean; size?: number; spacing?: number; italic?: boolean }): string {
  const size = opts.size ?? 22; // half-points; 22 = 11pt
  const runProps = `<w:rPr>${opts.bold ? '<w:b/>' : ''}${opts.italic ? '<w:i/>' : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>`;
  const paraProps = `<w:pPr><w:spacing${opts.spacing ? ` w:before="${opts.spacing}"` : ''} w:after="120"/></w:pPr>`;
  const lines = text.split('\n');
  const runs = lines
    .map((line, i) => {
      const br = i > 0 ? '<w:br/>' : '';
      return `<w:r>${runProps}${br}<w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
    })
    .join('');
  return `<w:p>${paraProps}${runs}</w:p>`;
}

/**
 * Generates a minimal but valid .docx (Word 2007+ OOXML) from a Claude chat.
 */
export function chatToDocx(chat: ClaudeChat): Uint8Array {
  const sections = chatToSections(chat);
  const body: string[] = [];

  body.push(docxParagraph(chat.name || 'Claude Chat', { bold: true, size: 36, spacing: 0 }));

  for (const section of sections) {
    if (section.heading) {
      body.push(docxParagraph(section.heading, { bold: true, size: 26, spacing: 240 }));
    }
    if (section.text) {
      const isMeta = !section.heading;
      body.push(docxParagraph(section.text, { size: isMeta ? 18 : 22, italic: isMeta }));
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  return buildZip([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'word/document.xml', data: documentXml },
  ]);
}

/* =====================================================================
   PDF generation
   ===================================================================== */

const PDF_CHARS_PER_LINE = 88; // ~ Helvetica 10pt on A4 with 57pt margins
const PDF_LINE_HEIGHT = 14;
const PDF_LINES_PER_PAGE = 55;

function pdfEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLine(text: string, max: number): string[] {
  const out: string[] = [];
  for (const raw of text.split('\n')) {
    if (raw.length <= max) {
      out.push(raw);
      continue;
    }
    let line = '';
    for (const word of raw.split(' ')) {
      let chunk = word;
      while (chunk.length > 0) {
        if (line.length === 0) {
          line = chunk.slice(0, max);
          chunk = chunk.slice(max);
          if (chunk.length > 0) {
            out.push(line);
            line = '';
          }
        } else if ((line + ' ' + chunk).length <= max) {
          line += ' ' + chunk;
          chunk = '';
        } else {
          out.push(line);
          line = chunk.slice(0, max);
          chunk = chunk.slice(max);
          if (chunk.length > 0) {
            out.push(line);
            line = '';
          }
        }
      }
    }
    if (line.length > 0) out.push(line);
  }
  return out;
}

interface PdfLine {
  text: string;
  bold: boolean;
  size: number;
  gapBefore: number;
}

/**
 * Generates a minimal valid multi-page PDF (Helvetica) from a Claude chat.
 */
export function chatToPdf(chat: ClaudeChat): Uint8Array {
  const lines: PdfLine[] = [];

  lines.push({ text: chat.name || 'Claude Chat', bold: true, size: 18, gapBefore: 0 });
  lines.push({ text: `Source: https://claude.ai/share/${chat.uuid}`, bold: false, size: 8, gapBefore: 8 });
  lines.push({ text: `${chat.messageCount} messages`, bold: false, size: 8, gapBefore: 0 });
  lines.push({ text: '', bold: false, size: 10, gapBefore: 4 });

  for (const section of chatToSections(chat)) {
    if (section.heading) {
      lines.push({ text: section.heading, bold: true, size: 13, gapBefore: 16 });
    }
    for (const wrapped of wrapLine(section.text || '', PDF_CHARS_PER_LINE)) {
      lines.push({ text: wrapped, bold: false, size: 10, gapBefore: 0 });
    }
  }

  // Typeset lines into page content streams
  const pageStreams: string[] = [];
  let ops: string[] = [];
  let used = 0;

  const flush = () => {
    if (ops.length === 0) return;
    const content = `BT\n1 0 0 1 57 785 Tm\n/F1 10 Tf\n${PDF_LINE_HEIGHT} TL\n${ops.join('\n')}\nET`;
    pageStreams.push(content);
    ops = [];
    used = 0;
  };

  for (const line of lines) {
    const gapLines = Math.ceil(line.gapBefore / PDF_LINE_HEIGHT);
    const need = (line.text ? 1 : 0) + gapLines;
    if (used + need > PDF_LINES_PER_PAGE) flush();

    if (gapLines > 0) {
      ops.push(`0 -${line.gapBefore} Td`);
      used += gapLines;
    }
    if (line.text) {
      ops.push(`${line.bold ? '/F2' : '/F1'} ${line.size} Tf`);
      ops.push(`(${pdfEscape(line.text)}) Tj`);
      ops.push('0 -14 Td');
      used += 1;
    }
  }
  flush();

  const nPages = Math.max(pageStreams.length, 1);
  const fontRegularId = 3 + nPages;
  const fontBoldId = fontRegularId + 1;
  const contentStartId = fontBoldId + 1;

  const objects: string[] = [];
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageStreams.map((_, i) => `${3 + i} 0 R`).join(' ')}] /Count ${nPages} >>`;

  pageStreams.forEach((stream, i) => {
    objects[3 + i] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> ` +
      `/Contents ${contentStartId + i} 0 R >>`;
  });

  objects[fontRegularId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objects[fontBoldId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;
  pageStreams.forEach((stream, i) => {
    objects[contentStartId + i] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Uint8Array(Buffer.from(pdf, 'latin1'));
}
