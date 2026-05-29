import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StreamFieldTracker } from "./reasoning-stream";

describe("local model stream content dedupe", () => {
  it("diffs cumulative content before think-tag splitting", () => {
    const tracker = new StreamFieldTracker();
    const pieces: string[] = [];
    for (const snap of ["Hello", "Hello world", "Hello world!"]) {
      const piece = tracker.push(snap);
      if (piece) pieces.push(piece);
    }
    assert.deepEqual(pieces, ["Hello", " world", "!"]);
  });
});
