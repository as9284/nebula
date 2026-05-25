import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractAllExportsFromContent,
  parseAlternateExportFences,
} from "./export-infer";

const assignId = () => "infer-1";

describe("parseAlternateExportFences", () => {
  it("parses html code fence as html export", () => {
    const content = `\`\`\`html
<!DOCTYPE html><html><body><p>Hi</p></body></html>
\`\`\``;
    const exports = parseAlternateExportFences(content, assignId);
    assert.equal(exports.length, 1);
    assert.equal(exports[0].format, "html");
    assert.match(exports[0].body, /<html/i);
  });
});

describe("extractAllExportsFromContent", () => {
  it("infers pdf from user intent when model only returns prose", () => {
    const raw = `# Report\n\n## Section\n\nLots of markdown content here for the pdf export.`;
    const { exports } = extractAllExportsFromContent(
      raw,
      assignId,
      "please make a pdf of this report",
    );
    assert.equal(exports.length, 1);
    assert.equal(exports[0].format, "pdf");
  });
});
