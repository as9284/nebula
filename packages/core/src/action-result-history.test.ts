import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatActionResultsForHistory } from "./action-result-history";

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
});
