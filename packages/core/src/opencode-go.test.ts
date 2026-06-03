import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatOpenCodeGoModelLabel,
  isOpenCodeGoAnthropicModel,
  parseOpenCodeGoModelsResponse,
  resolveOpenCodeGoLlmConfig,
  OPENCODE_GO_CHAT_COMPLETIONS_URL,
  OPENCODE_GO_MESSAGES_URL,
} from "./opencode-go";

describe("isOpenCodeGoAnthropicModel", () => {
  it("detects Anthropic-routed Go models", () => {
    assert.equal(isOpenCodeGoAnthropicModel("minimax-m2.7"), true);
    assert.equal(isOpenCodeGoAnthropicModel("qwen3.7-max"), true);
  });

  it("treats chat-completions models as non-anthropic", () => {
    assert.equal(isOpenCodeGoAnthropicModel("deepseek-v4-pro"), false);
    assert.equal(isOpenCodeGoAnthropicModel("kimi-k2.6"), false);
  });
});

describe("resolveOpenCodeGoLlmConfig", () => {
  it("uses chat completions for OpenAI-compatible models", () => {
    const cfg = resolveOpenCodeGoLlmConfig("sk-test", "glm-5.1");
    assert.equal(cfg.provider, "openai");
    assert.equal(cfg.baseUrl, OPENCODE_GO_CHAT_COMPLETIONS_URL);
    assert.equal(cfg.model, "glm-5.1");
  });

  it("uses messages endpoint for Anthropic-routed models", () => {
    const cfg = resolveOpenCodeGoLlmConfig("sk-test", "minimax-m3");
    assert.equal(cfg.provider, "anthropic");
    assert.equal(cfg.baseUrl, OPENCODE_GO_MESSAGES_URL);
  });
});

describe("formatOpenCodeGoModelLabel", () => {
  it("formats model ids readably", () => {
    assert.equal(
      formatOpenCodeGoModelLabel("deepseek-v4-pro"),
      "DeepSeek v4 Pro",
    );
    assert.equal(formatOpenCodeGoModelLabel("kimi-k2.6"), "Kimi K2.6");
  });
});

describe("parseOpenCodeGoModelsResponse", () => {
  it("extracts model list from API shape", () => {
    const models = parseOpenCodeGoModelsResponse({
      object: "list",
      data: [{ id: "glm-5", object: "model" }],
    });
    assert.equal(models.length, 1);
    assert.equal(models[0]?.id, "glm-5");
  });
});
