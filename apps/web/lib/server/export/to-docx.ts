import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { parseMarkdownBlocks } from "./markdown-blocks";

function headingLevel(level: 1 | 2 | 3): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  if (level === 1) return HeadingLevel.HEADING_1;
  if (level === 2) return HeadingLevel.HEADING_2;
  return HeadingLevel.HEADING_3;
}

export async function markdownToDocxBuffer(
  body: string,
  title?: string,
): Promise<Buffer> {
  const children: Paragraph[] = [];

  if (title?.trim()) {
    children.push(
      new Paragraph({
        text: title.trim(),
        heading: HeadingLevel.TITLE,
      }),
    );
  }

  for (const block of parseMarkdownBlocks(body)) {
    switch (block.type) {
      case "heading":
        children.push(
          new Paragraph({
            text: block.text,
            heading: headingLevel(block.level),
          }),
        );
        break;
      case "paragraph":
        children.push(new Paragraph({ children: [new TextRun(block.text)] }));
        break;
      case "bullet":
        for (const item of block.items) {
          children.push(
            new Paragraph({
              children: [new TextRun(item)],
              bullet: { level: 0 },
            }),
          );
        }
        break;
      case "code":
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                font: "Courier New",
              }),
            ],
          }),
        );
        break;
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
