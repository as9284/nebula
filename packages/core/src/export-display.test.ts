import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveExportDisplayMessage } from "./export-display";
import type { FileExport } from "./export-schema";

const sampleExport: FileExport = {
  id: "1",
  format: "pdf",
  filename: "report.pdf",
  body: "# Title\n\nLong body content that should not appear in the chat thread.",
};

describe("resolveExportDisplayMessage", () => {
  it("returns ack when display is empty", () => {
    const result = resolveExportDisplayMessage("", [sampleExport]);
    assert.match(result, /ready/i);
    assert.match(result, /report\.pdf/i);
  });

  it("replaces display that duplicates export body", () => {
    const display = sampleExport.body;
    const result = resolveExportDisplayMessage(display, [sampleExport]);
    assert.doesNotMatch(result, /Long body content/);
    assert.match(result, /ready/i);
  });
});
