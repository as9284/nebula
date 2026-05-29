import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  forceIpv4Loopback,
  isLoopbackUrl,
  normalizeOpenAiCompletionsUrl,
} from "./llm-config";

describe("isLoopbackUrl", () => {
  it("detects loopback hosts (browser-side dispatch)", () => {
    assert.equal(isLoopbackUrl("http://localhost:1234/v1/chat/completions"), true);
    assert.equal(isLoopbackUrl("http://127.0.0.1:11434/v1"), true);
    assert.equal(isLoopbackUrl("http://[::1]:1234/v1"), true);
  });

  it("treats remote hosts as non-loopback", () => {
    assert.equal(isLoopbackUrl("https://api.openai.com/v1/chat/completions"), false);
    assert.equal(isLoopbackUrl("not a url"), false);
  });
});

describe("forceIpv4Loopback", () => {
  it("rewrites localhost to 127.0.0.1 (Ollama/LM Studio bind IPv4 only)", () => {
    assert.equal(
      forceIpv4Loopback("http://localhost:1234/v1/chat/completions"),
      "http://127.0.0.1:1234/v1/chat/completions",
    );
    assert.equal(
      forceIpv4Loopback("http://localhost:11434/v1/chat/completions"),
      "http://127.0.0.1:11434/v1/chat/completions",
    );
  });

  it("leaves non-localhost hosts untouched", () => {
    assert.equal(
      forceIpv4Loopback("https://api.openai.com/v1/chat/completions"),
      "https://api.openai.com/v1/chat/completions",
    );
  });

  it("returns non-URL input unchanged", () => {
    assert.equal(forceIpv4Loopback(""), "");
  });
});

describe("normalizeOpenAiCompletionsUrl", () => {
  it("keeps a full completions URL and pins loopback to IPv4", () => {
    assert.equal(
      normalizeOpenAiCompletionsUrl("http://localhost:1234/v1/chat/completions"),
      "http://127.0.0.1:1234/v1/chat/completions",
    );
  });

  it("appends the completions path for a base URL", () => {
    assert.equal(
      normalizeOpenAiCompletionsUrl("http://localhost:11434/v1"),
      "http://127.0.0.1:11434/v1/chat/completions",
    );
  });

  it("strips trailing slashes before appending", () => {
    assert.equal(
      normalizeOpenAiCompletionsUrl("https://api.openai.com/v1/"),
      "https://api.openai.com/v1/chat/completions",
    );
  });
});
