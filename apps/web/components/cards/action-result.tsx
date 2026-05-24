"use client";

import type { ActionResult } from "@/lib/constellation-registry";
import { constellationHandlers } from "@/lib/constellations";
import {
  groupSimpleActionResults,
  isRichActionResult,
} from "@/lib/format-action-results";
import { SimpleActionGroupCard } from "./simple-action-group";

export function ActionResults({ results }: { results: ActionResult[] }) {
  const rich = results.filter(
    (r) => isRichActionResult(r) && r.type !== "ui_artifact",
  );
  const simpleGroups = groupSimpleActionResults(results);

  if (rich.length === 0 && simpleGroups.length === 0) return null;

  return (
    <div className="mt-3 flex min-w-0 max-w-full flex-col gap-2">
      {simpleGroups.map((group) => (
        <SimpleActionGroupCard
          key={`${group.type}-${group.heading}-${group.items.length}`}
          group={group}
        />
      ))}
      {rich.map((result, i) => {
        const handler = constellationHandlers.find(
          (h) => h.tag === result.handler,
        );
        if (!handler) return null;
        const Card = handler.ResultCard;
        return <Card key={`${result.type}-${result.handler}-${i}`} result={result} />;
      })}
    </div>
  );
}
