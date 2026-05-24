import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseNebulaArtifactFences,
  stripNebulaArtifactFences,
  validateCodeArtifact,
} from "./artifact-schema";

const assignId = () => "test-id-1";

describe("parseNebulaArtifactFences", () => {
  it("parses a valid react artifact fence", () => {
    const content = `Here you go.

\`\`\`nebula-artifact
{"title":"Neon button","template":"react","files":{"/App.tsx":"export default function App() { return <button>Hi</button>; }"}}
\`\`\``;
    const { artifacts, errors } = parseNebulaArtifactFences(content, assignId);
    assert.equal(errors.length, 0);
    assert.equal(artifacts.length, 1);
    assert.equal(artifacts[0].title, "Neon button");
    assert.equal(artifacts[0].template, "react");
    assert.ok(artifacts[0].files["/App.tsx"]);
  });

  it("rejects disallowed dependencies", () => {
    const content = `\`\`\`nebula-artifact
{"template":"react","files":{"/App.tsx":"x"},"dependencies":{"lodash":"1.0.0"}}
\`\`\``;
    const { artifacts, errors } = parseNebulaArtifactFences(content, assignId);
    assert.equal(artifacts.length, 0);
    assert.match(errors[0]?.message ?? "", /not allowed/i);
  });

  it("does not strip normal code fences", () => {
    const content = "Example:\n\n```js\nconsole.log(1)\n```";
    const stripped = stripNebulaArtifactFences(content);
    assert.match(stripped, /console\.log/);
  });
});

describe("stripNebulaArtifactFences", () => {
  it("removes complete artifact fences", () => {
    const content = `Done.

\`\`\`nebula-artifact
{"template":"html","files":{"/index.html":"<html></html>"}}
\`\`\``;
    const stripped = stripNebulaArtifactFences(content);
    assert.equal(stripped, "Done.");
  });

  it("removes trailing partial artifact fence while streaming", () => {
    const partial = `Sure.

\`\`\`nebula-artifact
{"template":"react","files":`;
    const stripped = stripNebulaArtifactFences(partial);
    assert.equal(stripped, "Sure.");
  });
});

describe("validateCodeArtifact", () => {
  it("requires an html file for html template", () => {
    const result = validateCodeArtifact(
      { template: "html", files: { "/styles.css": "body{}" } },
      assignId,
    );
    assert.ok("error" in result);
    assert.match(result.error, /html/i);
  });
});
