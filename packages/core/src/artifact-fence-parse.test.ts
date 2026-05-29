import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseArtifactFenceBody,
  parseMultilineArtifactBody,
} from "./artifact-fence-parse";
import { parseNebulaArtifactFences } from "./artifact-schema";

const assignId = () => "id-1";

describe("parseMultilineArtifactBody", () => {
  it("parses template, title, and file sections", () => {
    const body = `template: react
title: Neon button
--- /App.tsx
export default function App() {
  return <button>Hi</button>;
}
--- /styles.css
.neon { color: cyan; }`;

    const parsed = parseMultilineArtifactBody(body);
    assert.ok(parsed);
    assert.equal(parsed.template, "react");
    assert.equal(parsed.title, "Neon button");
    const files = parsed.files as Record<string, string>;
    assert.match(files["/App.tsx"], /button/);
    assert.match(files["/styles.css"], /\.neon/);
  });

  it("parses when the meta block is omitted (header is the first line)", () => {
    const body = `--- /App.tsx
export default function App() { return <span>ok</span>; }`;
    const parsed = parseMultilineArtifactBody(body);
    assert.ok(parsed);
    assert.equal(parsed.template, "react");
    const files = parsed.files as Record<string, string>;
    assert.match(files["/App.tsx"], /ok/);
  });

  it("infers the html template from file extensions", () => {
    const body = `--- /index.html
<!doctype html><html><body>News</body></html>
--- /styles.css
body { margin: 0; }`;
    const parsed = parseMultilineArtifactBody(body);
    assert.ok(parsed);
    assert.equal(parsed.template, "html");
    const files = parsed.files as Record<string, string>;
    assert.ok(files["/index.html"]);
    assert.ok(files["/styles.css"]);
  });

  it("tolerates missing slash, missing space, and extra dashes in headers", () => {
    const body = `template: react
---- App.jsx
export default () => null;
---/styles.css
.x { color: red; }`;
    const parsed = parseMultilineArtifactBody(body);
    assert.ok(parsed);
    const files = parsed.files as Record<string, string>;
    assert.ok(files["/App.jsx"]);
    assert.ok(files["/styles.css"]);
  });
});

describe("parseArtifactFenceBody", () => {
  it("repairs JSON with trailing commas", () => {
    const body = `{
      "title": "Btn",
      "template": "react",
      "files": { "/App.tsx": "export default () => null", },
    }`;
    const parsed = parseArtifactFenceBody(body);
    assert.ok(parsed);
    assert.equal((parsed as { title: string }).title, "Btn");
  });
});

describe("parseNebulaArtifactFences with multiline", () => {
  it("extracts artifact from multiline fence", () => {
    const content = `Done.

\`\`\`nebula-artifact
template: react
title: Test
--- /App.tsx
export default function App() { return <span>ok</span>; }
\`\`\``;
    const { artifacts, errors } = parseNebulaArtifactFences(content, assignId);
    assert.equal(errors.length, 0);
    assert.equal(artifacts.length, 1);
    assert.equal(artifacts[0].title, "Test");
  });
});
