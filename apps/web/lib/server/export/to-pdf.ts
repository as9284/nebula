import { parseMarkdownBlocks } from "./markdown-blocks";

type PdfContent = Record<string, unknown>;
type PdfDocDefinition = {
  content: PdfContent[];
  styles?: Record<string, unknown>;
  defaultStyle?: Record<string, unknown>;
};

type PdfDocument = {
  getBuffer: (
    callback: (buffer: Buffer, error?: Error) => void,
  ) => void;
};

type PdfMakeInstance = {
  addVirtualFileSystem: (vfs: Record<string, string>) => void;
  setFonts: (fonts: Record<string, Record<string, string>>) => void;
  createPdf: (doc: PdfDocDefinition) => PdfDocument;
};

let pdfMakeReady: Promise<PdfMakeInstance> | null = null;

async function getPdfMake(): Promise<PdfMakeInstance> {
  if (!pdfMakeReady) {
    pdfMakeReady = (async () => {
      const pdfMakeModule = await import("pdfmake/build/pdfmake");
      const vfsModule = await import("pdfmake/build/vfs_fonts");
      const pdfMake = pdfMakeModule.default as PdfMakeInstance;
      const vfs = vfsModule.default as Record<string, string>;

      pdfMake.addVirtualFileSystem(vfs);
      pdfMake.setFonts({
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      });

      return pdfMake;
    })();
  }
  return pdfMakeReady;
}

function getPdfBuffer(doc: PdfDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    doc.getBuffer((buffer, error) => {
      if (error) reject(error);
      else resolve(Buffer.from(buffer));
    });
  });
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
  const pdfMake = await getPdfMake();
  const docDefinition: PdfDocDefinition = {
    content: blocksToPdfContent(body, title),
    styles: {
      title: { fontSize: 20, bold: true },
      h1: { fontSize: 18, bold: true },
      h2: { fontSize: 15, bold: true },
      h3: { fontSize: 13, bold: true },
    },
    defaultStyle: { fontSize: 11, font: "Roboto" },
  };

  const pdf = pdfMake.createPdf(docDefinition);
  return getPdfBuffer(pdf);
}
