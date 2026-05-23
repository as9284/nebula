import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasActionSyntax,
  stripActionSyntax,
  type ConstellationHandler,
} from "./constellation-registry";

const mockHandlers = [
  {
    tag: "orbit-commands",
    name: "Orbit",
    multiCommand: true,
    promptInstructions: "",
    buildContext: () => "",
    execute: async () => [],
    ResultCard: () => null,
  },
] as const satisfies readonly ConstellationHandler[];

describe("stripActionSyntax", () => {
  it("removes bare CREATE_TASK lines", () => {
    const raw =
      'Done.\n\nCREATE_TASK {"title":"test","priority":"medium"}';
    const cleaned = stripActionSyntax(raw, mockHandlers);
    assert.equal(cleaned, "Done.");
    assert.equal(hasActionSyntax(raw, mockHandlers), true);
  });

  it("removes trailing partial bare commands while streaming", () => {
    const partial = 'Sure.\n\nCREATE_TASK {"title":"te';
    const cleaned = stripActionSyntax(partial, mockHandlers);
    assert.equal(cleaned, "Sure.");
  });
});
