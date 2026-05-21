"use client";

import type { ActionResult } from "@/lib/constellation-registry";
import { constellationHandlers } from "@/lib/constellations";

export function ActionResults({ results }: { results: ActionResult[] }) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {results.map((result, i) => {
        const handler = constellationHandlers.find(
          (h) => h.tag === result.handler,
        );
        if (!handler) return null;
        const Card = handler.ResultCard;
        return <Card key={`${result.type}-${i}`} result={result} />;
      })}
    </div>
  );
}
