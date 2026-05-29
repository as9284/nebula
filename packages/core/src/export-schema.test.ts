import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseNebulaExportFences,
  stripNebulaExportFences,
  validateFileExport,
} from "./export-schema";

const assignId = () => "export-test-1";

describe("parseNebulaExportFences", () => {
  it("parses multiline export fence", () => {
    const content = `Here is your file.

\`\`\`nebula-export
format: pdf
filename: report.pdf
title: Q4 Report
---
# Summary
Revenue grew 12%.
\`\`\``;
    const { exports, errors } = parseNebulaExportFences(content, assignId);
    assert.equal(errors.length, 0);
    assert.equal(exports.length, 1);
    assert.equal(exports[0].format, "pdf");
    assert.equal(exports[0].filename, "report.pdf");
    assert.equal(exports[0].title, "Q4 Report");
    assert.match(exports[0].body, /Revenue grew/);
  });

  it("parses JSON export fence", () => {
    const content = `\`\`\`nebula-export
{"format":"txt","filename":"notes.txt","body":"Hello world"}
\`\`\``;
    const { exports, errors } = parseNebulaExportFences(content, assignId);
    assert.equal(errors.length, 0);
    assert.equal(exports[0].format, "txt");
    assert.equal(exports[0].body, "Hello world");
  });

  it("infers format from the filename when format: is omitted", () => {
    const content = `Your file is ready.

\`\`\`nebula-export
filename: report.pdf
title: Q4 Report
---
# Summary
Revenue grew 12%.
\`\`\``;
    const { exports, errors } = parseNebulaExportFences(content, assignId);
    assert.equal(errors.length, 0);
    assert.equal(exports.length, 1);
    assert.equal(exports[0].format, "pdf");
    assert.equal(exports[0].filename, "report.pdf");
  });

  it("infers format from filename without a --- separator", () => {
    const content = `\`\`\`nebula-export
filename: notes.txt
Buy milk
Walk the dog
\`\`\``;
    const { exports, errors } = parseNebulaExportFences(content, assignId);
    assert.equal(errors.length, 0);
    assert.equal(exports.length, 1);
    assert.equal(exports[0].format, "txt");
    assert.match(exports[0].body, /Buy milk/);
  });

  it("rejects invalid format", () => {
    const content = `\`\`\`nebula-export
format: exe
filename: bad.exe
---
data
\`\`\``;
    const { exports, errors } = parseNebulaExportFences(content, assignId);
    assert.equal(exports.length, 0);
    assert.ok(errors.length > 0);
  });

  it("requires valid JSON body for json format", () => {
    const result = validateFileExport(
      { format: "json", body: "not json" },
      assignId,
    );
    assert.ok("error" in result);
    assert.match(result.error, /valid JSON/i);
  });
});

describe("stripNebulaExportFences", () => {
  it("removes complete export fences", () => {
    const content = `Done.

\`\`\`nebula-export
format: txt
filename: out.txt
---
hello
\`\`\``;
    const stripped = stripNebulaExportFences(content);
    assert.equal(stripped, "Done.");
  });

  it("removes trailing partial export fence while streaming", () => {
    const partial = `Sure.

\`\`\`nebula-export
format: pdf`;
    const stripped = stripNebulaExportFences(partial);
    assert.equal(stripped, "Sure.");
  });
});

describe("validateFileExport", () => {
  it("sanitizes unsafe filenames", () => {
    const result = validateFileExport(
      { format: "md", filename: "../../../evil.md", body: "# Hi" },
      assignId,
    );
    assert.ok("export" in result);
    assert.equal(result.export.filename, "evil.md");
  });

  it("appends extension when missing", () => {
    const result = validateFileExport(
      { format: "docx", filename: "report", body: "# Doc" },
      assignId,
    );
    assert.ok("export" in result);
    assert.equal(result.export.filename, "report.docx");
  });
});
