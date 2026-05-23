import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OpenAiStreamDeltaParser,
  StreamFieldTracker,
} from "./reasoning-stream";

describe("StreamFieldTracker", () => {
  it("diffs cumulative content snapshots", () => {
    const tracker = new StreamFieldTracker();
    assert.equal(tracker.push("Hello"), "Hello");
    assert.equal(tracker.push("Hello world"), " world");
    assert.equal(tracker.push("Hello world!"), "!");
  });

  it("appends when snapshot is not a prefix", () => {
    const tracker = new StreamFieldTracker();
    assert.equal(tracker.push("ab"), "ab");
    assert.equal(tracker.push("cd"), "cd");
  });
});

describe("OpenAiStreamDeltaParser", () => {
  it("diffs cumulative reasoning_details per index", () => {
    const parser = new OpenAiStreamDeltaParser();
    const first = parser.parse({
      choices: [
        {
          delta: {
            reasoning_details: [{ text: "Let me" }],
          },
        },
      ],
    });
    assert.equal(first.reasoning, "Let me");

    const second = parser.parse({
      choices: [
        {
          delta: {
            reasoning_details: [{ text: "Let me think" }],
          },
        },
      ],
    });
    assert.equal(second.reasoning, " think");
  });

  it("reads message.content when delta content is absent", () => {
    const parser = new OpenAiStreamDeltaParser();
    const delta = parser.parse({
      choices: [
        {
          message: { content: "Full reply" },
        },
      ],
    });
    assert.equal(delta.content, "Full reply");
  });
});
