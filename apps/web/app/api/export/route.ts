import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_EXPORT_BODY_BYTES } from "@nebula/core/export-schema";
import { markdownToDocxBuffer } from "@/lib/server/export/to-docx";
import { markdownToPdfBuffer } from "@/lib/server/export/to-pdf";

const exportRequestSchema = z.object({
  format: z.enum(["pdf", "docx"]),
  filename: z.string().max(200),
  title: z.string().max(200).optional(),
  body: z.string(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = exportRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { format, filename, title, body } = parsed.data;
  const bytes = new TextEncoder().encode(body).length;
  if (bytes > MAX_EXPORT_BODY_BYTES) {
    return NextResponse.json(
      { error: `Body too large (max ${MAX_EXPORT_BODY_BYTES} bytes)` },
      { status: 413 },
    );
  }

  if (!body.trim()) {
    return NextResponse.json({ error: "Body must not be empty" }, { status: 400 });
  }

  try {
    const buffer =
      format === "pdf"
        ? await markdownToPdfBuffer(body, title)
        : await markdownToDocxBuffer(body, title);

    const mime =
      format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const safeName = filename.replace(/[^\w.\-]+/g, "_") || `export.${format}`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
