import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyOpenCodeGoVisionCatalog,
  enrichOpenCodeGoModelsWithCatalog,
  formatOpenCodeGoModelLabel,
  isOpenCodeGoAnthropicModel,
  isOpenCodeGoVisionModel,
  modalitiesIncludeVision,
  parseOpenCodeGoCatalog,
  parseOpenCodeGoModelsResponse,
  resolveOpenCodeGoLlmConfig,
  setOpenCodeGoVisionModelIdsForTests,
  OPENCODE_GO_CHAT_COMPLETIONS_URL,
  OPENCODE_GO_MESSAGES_URL,
} from "./opencode-go";
import { modelSupportsVision } from "./vision-support";

const SAMPLE_CATALOG = {
  "opencode-go": {
    models: {
      "kimi-k2.6": {
        modalities: { input: ["text", "image", "video"], output: ["text"] },
      },
      "glm-5.1": {
        modalities: { input: ["text"], output: ["text"] },
      },
      "mimo-v2-omni": {
        modalities: { input: ["text", "image", "audio", "pdf"], output: ["text"] },
      },
    },
  },
};

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

describe("parseOpenCodeGoCatalog", () => {
  it("reads modalities from models.dev opencode-go section", () => {
    const catalog = parseOpenCodeGoCatalog(SAMPLE_CATALOG);
    assert.equal(catalog.size, 3);
    assert.equal(modalitiesIncludeVision(catalog.get("kimi-k2.6")!), true);
    assert.equal(modalitiesIncludeVision(catalog.get("glm-5.1")!), false);
  });
});

describe("enrichOpenCodeGoModelsWithCatalog", () => {
  it("attaches supportsVision from catalog entries", () => {
    const catalog = parseOpenCodeGoCatalog(SAMPLE_CATALOG);
    applyOpenCodeGoVisionCatalog(catalog);
    const enriched = enrichOpenCodeGoModelsWithCatalog(
      [{ id: "kimi-k2.6", object: "model" }, { id: "glm-5.1", object: "model" }],
      catalog,
    );
    assert.equal(enriched[0]?.supportsVision, true);
    assert.equal(enriched[1]?.supportsVision, false);
  });
});

describe("isOpenCodeGoVisionModel", () => {
  it("uses catalog-derived vision ids when loaded", () => {
    const catalog = parseOpenCodeGoCatalog(SAMPLE_CATALOG);
    applyOpenCodeGoVisionCatalog(catalog);
    assert.equal(isOpenCodeGoVisionModel("kimi-k2.6"), true);
    assert.equal(isOpenCodeGoVisionModel("glm-5.1"), false);
    assert.equal(isOpenCodeGoVisionModel("deepseek-v4-pro"), false);
    setOpenCodeGoVisionModelIdsForTests(null);
  });
});

describe("modelSupportsVision for OpenCode Go", () => {
  it("uses the Go vision catalog", () => {
    setOpenCodeGoVisionModelIdsForTests(["kimi-k2.5", "kimi-k2.6"]);
    const kimi = resolveOpenCodeGoLlmConfig("sk-test", "kimi-k2.5");
    const deepseek = resolveOpenCodeGoLlmConfig("sk-test", "deepseek-v4-pro");
    assert.equal(modelSupportsVision(kimi), true);
    assert.equal(modelSupportsVision(deepseek), false);
    setOpenCodeGoVisionModelIdsForTests(null);
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
