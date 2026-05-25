import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dedupeExportsByFormat,
  extractAllExportsFromContent,
  parseAlternateExportFences,
  suggestExportFilename,
} from "./export-infer";

const assignId = () => "infer-1";

describe("parseAlternateExportFences", () => {
  it("parses html code fence as html export", () => {
    const content = `\`\`\`html
<!DOCTYPE html><html><body><p>Hi</p></body></html>
\`\`\``;
    const exports = parseAlternateExportFences(
      content,
      assignId,
      "make a test html file",
    );
    assert.equal(exports.length, 1);
    assert.equal(exports[0].format, "html");
    assert.equal(exports[0].filename, "test-document.html");
  });
});

describe("dedupeExportsByFormat", () => {
  it("prefers explicit filename over export-id default", () => {
    const deduped = dedupeExportsByFormat([
      {
        id: "1",
        format: "html",
        filename: "test-document.html",
        body: "<html>a</html>",
      },
      {
        id: "2",
        format: "html",
        filename: "export-2.html",
        body: "<html>b</html>",
      },
    ]);
    assert.equal(deduped.length, 1);
    assert.equal(deduped[0].filename, "test-document.html");
  });
});

describe("suggestExportFilename", () => {
  it("suggests test-document.html for test html requests", () => {
    assert.equal(
      suggestExportFilename("make a test html file", "html"),
      "test-document.html",
    );
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

  it("does not duplicate html when nebula-export and html fence both present", () => {
    const raw = `\`\`\`nebula-export
format: html
filename: test-document.html
---
<html><body>Hi</body></html>
\`\`\`

\`\`\`html
<html><body>Hi</body></html>
\`\`\``;
    const { exports } = extractAllExportsFromContent(
      raw,
      assignId,
      "make a test html file",
    );
    assert.equal(exports.length, 1);
    assert.equal(exports[0].filename, "test-document.html");
  });
});
