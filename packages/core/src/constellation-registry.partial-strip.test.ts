import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripCommandBlocks, type ConstellationHandler } from "./constellation-registry";

const mockHandlers = [
  {
    tag: "sandbox-commands",
    name: "Sandbox",
    multiCommand: false,
    promptInstructions: "",
    buildContext: () => "",
    execute: async () => [],
    ResultCard: () => null,
  },
] as const satisfies readonly ConstellationHandler[];

describe("stripCommandBlocks partial fences", () => {
  it("does not strip a lone trailing triple-backtick", () => {
    const raw = "Here is a note about ```";
    const cleaned = stripCommandBlocks(raw, mockHandlers);
    assert.equal(cleaned, raw);
  });

  it("strips a partial sandbox-commands fence at end while streaming", () => {
    const raw = "Done.\n\n```sandbox-comm";
    const cleaned = stripCommandBlocks(raw, mockHandlers);
    assert.equal(cleaned, "Done.");
  });
});
