import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Mirror inferStreamPhase logic for core-side doc; web copy is canonical.
function inferStreamPhase(
  rawContent: string,
  displayContent: string,
): string {
  if (displayContent.trim().length > 0) return "streaming";
  if (/```nebula-artifact|^\s*template\s*:\s*(react|html)\s*$/im.test(rawContent)) {
    return "building_ui";
  }
  return "thinking";
}

describe("inferStreamPhase", () => {
  it("detects building_ui when artifact fence is in progress", () => {
    assert.equal(
      inferStreamPhase("Short intro\n\n```nebula-artifact\ntemplate: html", ""),
      "building_ui",
    );
  });
});
