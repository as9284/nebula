import {
  parseNebulaArtifactFences,
  stripNebulaArtifactFences,
  type CodeArtifact,
} from "@nebula/core/artifact-schema";
import { stripNebulaExportFences } from "@nebula/core/export-schema";
import { stripActionSyntax } from "@/lib/constellation-registry";
import type { ConstellationHandler } from "@/lib/constellation-registry";
import type { ActionResult } from "@/lib/constellation-registry";
import { generateId } from "@/lib/utils";

export function stripAssistantDisplayContent(
  content: string,
  handlers: readonly ConstellationHandler[],
): string {
  return stripActionSyntax(
    stripNebulaExportFences(stripNebulaArtifactFences(content)),
    handlers,
  );
}

export function extractArtifactsFromResponse(content: string): {
  artifacts: CodeArtifact[];
  artifactErrors: ActionResult[];
} {
  const { artifacts, errors } = parseNebulaArtifactFences(content, generateId);
  const artifactErrors: ActionResult[] = errors.map((e) => ({
    type: "command_error",
    handler: "sandbox-commands",
    message: e.message,
  }));
  return { artifacts, artifactErrors };
}

export function uiArtifactActionResults(
  artifacts: CodeArtifact[],
): ActionResult[] {
  return artifacts.map((artifact) => ({
    type: "ui_artifact",
    handler: "sandbox-commands",
    artifact,
  }));
}
