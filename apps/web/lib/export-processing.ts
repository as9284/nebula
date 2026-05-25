import {
  parseNebulaExportFences,
  validateFileExport,
  type FileExport,
} from "@nebula/core/export-schema";
import type { ActionResult } from "@/lib/constellation-registry";
import { generateId } from "@/lib/utils";

export function extractExportsFromResponse(content: string): {
  exports: FileExport[];
  exportErrors: ActionResult[];
} {
  const { exports, errors } = parseNebulaExportFences(content, generateId);
  const exportErrors: ActionResult[] = errors.map((e) => ({
    type: "file_error",
    handler: "file-commands",
    message: e.message,
  }));
  return { exports, exportErrors };
}

export function fileExportActionResults(exports: FileExport[]): ActionResult[] {
  return exports.map((fileExport) => ({
    type: "file_generated",
    handler: "file-commands",
    id: fileExport.id,
    format: fileExport.format,
    filename: fileExport.filename,
    title: fileExport.title,
    body: fileExport.body,
  }));
}

export function fileExportFromCommandArgs(
  args: Record<string, unknown>,
): ActionResult | null {
  const result = validateFileExport(
    {
      format: args.format,
      filename: args.filename,
      title: args.title,
      body: args.body,
    },
    generateId,
  );
  if ("error" in result) {
    return {
      type: "file_error",
      handler: "file-commands",
      message: result.error,
    };
  }
  const fileExport = result.export;
  return {
    type: "file_generated",
    handler: "file-commands",
    id: fileExport.id,
    format: fileExport.format,
    filename: fileExport.filename,
    title: fileExport.title,
    body: fileExport.body,
  };
}
