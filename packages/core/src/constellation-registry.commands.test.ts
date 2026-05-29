import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCommandsDetailed, parseBareCommands } from "./constellation-registry";

describe("command parsing for local models", () => {
  it("parses multiline JSON inside a fenced orbit block", () => {
    const content = `\`\`\`orbit-commands
CREATE_TASK {
  "title": "Buy milk",
  "priority": "medium"
}
\`\`\``;
    const { commands, errors } = parseCommandsDetailed(
      content,
      "orbit-commands",
      false,
    );
    assert.equal(errors.length, 0);
    assert.equal(commands.length, 1);
    assert.equal(commands[0].command, "CREATE_TASK");
    assert.equal(commands[0].args.title, "Buy milk");
  });

  it("repairs trailing commas in command JSON", () => {
    const content =
      'CREATE_TASK {"title":"x","priority":"high",}';
    const { commands } = parseBareCommands(content);
    assert.equal(commands.length, 1);
    assert.equal(commands[0].args.title, "x");
  });
});
