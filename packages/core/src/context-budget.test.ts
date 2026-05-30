import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  estimateTokens,
  getModelContextWindow,
  prepareChatContext,
  formatContextUsageLabel,
} from "./context-budget";

describe("estimateTokens", () => {
  it("uses ~4 chars per token", () => {
    assert.equal(estimateTokens("abcd"), 1);
    assert.equal(estimateTokens("a".repeat(8)), 2);
  });
});

describe("getModelContextWindow", () => {
  it("recognizes major model families", () => {
    assert.ok(getModelContextWindow("gpt-4o") >= 128_000);
    assert.ok(getModelContextWindow("claude-sonnet-4-20250514") >= 200_000);
    assert.ok(getModelContextWindow("gemini-2.5-flash") >= 1_000_000);
  });
});

describe("prepareChatContext", () => {
  it("keeps all messages when under budget", () => {
    const history = [
      { role: "user" as const, content: "Hi" },
      { role: "assistant" as const, content: "Hello" },
    ];
    const result = prepareChatContext(history, {
      model: "gpt-4o",
      systemPrompt: "You are helpful.",
    });
    assert.equal(result.messages.length, 2);
    assert.equal(result.wasPruned, false);
    assert.ok(result.usageRatio < 0.01);
  });

  it("injects summary and drops messages before boundary id", () => {
    const withIds = [
      { id: "m1", role: "user" as const, content: "old question" },
      { id: "m2", role: "assistant" as const, content: "old answer" },
      { id: "m3", role: "user" as const, content: "new question" },
      { id: "m4", role: "assistant" as const, content: "new answer" },
    ];
    const result = prepareChatContext(withIds, {
      model: "gpt-4o",
      systemPrompt: "sys",
      contextSummary: "User discussed weather earlier.",
      compactedBeforeMessageId: "m3",
    });
    assert.ok(
      result.messages[0].content.includes("Earlier in this conversation"),
    );
    assert.equal(result.messages.length, 3);
    assert.equal(result.droppedMessageCount, 2);
  });

  it("prunes oldest turns when over budget", () => {
    const big = "word ".repeat(5000).trim();
    const history = Array.from({ length: 40 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `${big} message ${i}`,
    }));
    const result = prepareChatContext(history, {
      model: "mistral-small-latest",
      systemPrompt: "x".repeat(2000),
      reserveForResponse: 2048,
    });
    assert.ok(result.wasPruned);
    assert.ok(result.messages.length < history.length);
    assert.ok(result.droppedMessageCount > 0);
  });
});

describe("formatContextUsageLabel", () => {
  it("formats percentages", () => {
    assert.equal(formatContextUsageLabel(100, 100_000), "<1% context");
    assert.equal(formatContextUsageLabel(90_000, 100_000), "90% context");
    assert.equal(formatContextUsageLabel(100_000, 100_000), "Context full");
  });
});
