import { parseMarkdownBlocks } from "./markdown-blocks";

type PdfContent = Record<string, unknown>;
type PdfDocDefinition = { content: PdfContent[]; styles?: Record<string, unknown>; defaultStyle?: Record<string, unknown> };

type PdfPrinter = {
  createPdf: (doc: PdfDocDefinition) => {
    getBuffer: () => Promise<Buffer | Uint8Array>;
  };
  vfs?: Record<string, string>;
};

async function getPdfPrinter(): Promise<PdfPrinter> {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const vfsModule = await import("pdfmake/build/vfs_fonts");
  const pdfMake = pdfMakeModule.default as PdfPrinter & {
    vfs?: Record<string, string>;
  };
  const vfs =
    (vfsModule as { pdfMake?: { vfs: Record<string, string> } }).pdfMake?.vfs ??
    (vfsModule as { default?: { pdfMake?: { vfs: Record<string, string> } } })
      .default?.pdfMake?.vfs;
  if (vfs) pdfMake.vfs = vfs;
  return pdfMake;
}

function blocksToPdfContent(body: string, title?: string): PdfContent[] {
  const content: PdfContent[] = [];

  if (title?.trim()) {
    content.push({ text: title.trim(), style: "title", margin: [0, 0, 0, 12] });
  }

  for (const block of parseMarkdownBlocks(body)) {
    switch (block.type) {
      case "heading":
        content.push({
          text: block.text,
          style: block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3",
          margin: [0, 8, 0, 4],
        });
        break;
      case "paragraph":
        content.push({ text: block.text, margin: [0, 0, 0, 8] });
        break;
      case "bullet":
        content.push({
          ul: block.items.map((t) => t),
          margin: [0, 0, 0, 8],
        });
        break;
      case "code":
        content.push({
          text: block.text,
          font: "Courier",
          fontSize: 9,
          margin: [0, 4, 0, 8],
          preserveLeadingSpaces: true,
        });
        break;
    }
  }

  if (content.length === 0) {
    content.push({ text: body.trim() || "(empty)" });
  }

  return content;
}

export async function markdownToPdfBuffer(
  body: string,
  title?: string,
): Promise<Buffer> {
  const pdfMake = await getPdfPrinter();
  const docDefinition: PdfDocDefinition = {
    content: blocksToPdfContent(body, title),
    styles: {
      title: { fontSize: 20, bold: true },
      h1: { fontSize: 18, bold: true },
      h2: { fontSize: 15, bold: true },
      h3: { fontSize: 13, bold: true },
    },
    defaultStyle: { fontSize: 11 },
  };

  const pdf = pdfMake.createPdf(docDefinition);
  const buffer = await pdf.getBuffer();
  return Buffer.from(buffer);
}
