import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeArtifactFileContent,
  normalizeArtifactFiles,
} from "./artifact-normalize";

describe("normalizeArtifactFileContent", () => {
  it("converts literal \\n sequences to newlines", () => {
    const raw = ".btn {\\n  color: cyan;\\n}";
    const out = normalizeArtifactFileContent(raw);
    assert.equal(out, ".btn {\n  color: cyan;\n}");
  });

  it("preserves content that already has real newlines", () => {
    const raw = ".btn {\n  color: cyan;\n}";
    assert.equal(normalizeArtifactFileContent(raw), raw);
  });
});

describe("normalizeArtifactFiles", () => {
  it("normalizes every file in the map", () => {
    const out = normalizeArtifactFiles({
      "/styles.css": "a {\\n  color: red;\\n}",
    });
    assert.match(out["/styles.css"], /\n/);
  });
});
