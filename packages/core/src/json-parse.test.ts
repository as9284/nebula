import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseJsonLenient } from "./json-parse";

describe("parseJsonLenient", () => {
  it("repairs trailing commas", () => {
    const parsed = parseJsonLenient('{"search":true,"query":"news",}') as {
      search: boolean;
    };
    assert.equal(parsed.search, true);
  });
});
