import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatActionResultsForHistory,
  stripLeakedActionHistoryFromDisplay,
} from "./action-result-history";

describe("formatActionResultsForHistory", () => {
  it("includes ui_artifact with id and title", () => {
    const block = formatActionResultsForHistory([
      {
        type: "ui_artifact",
        handler: "sandbox-commands",
        artifact: {
          id: "art-1",
          title: "Neon button",
          template: "react",
          files: { "/App.tsx": "export default () => null" },
        },
      },
    ]);
    assert.match(block, /Neon button/);
    assert.match(block, /art-1/);
  });

  it("omits file_generated from history block", () => {
    const block = formatActionResultsForHistory([
      {
        type: "file_generated",
        handler: "file-commands",
        id: "f1",
        filename: "test.html",
        format: "html",
        body: "<html></html>",
      },
    ]);
    assert.equal(block, "");
  });
});

describe("stripLeakedActionHistoryFromDisplay", () => {
  it("removes echoed action history block and bullets", () => {
    const display = `Your HTML file is ready.

[Actions executed — saved in Nebula; use these IDs for follow-up commands]
- Generated file "test-document.html" [abc-123]`;

    const stripped = stripLeakedActionHistoryFromDisplay(display);
    assert.equal(stripped, "Your HTML file is ready.");
  });
});
