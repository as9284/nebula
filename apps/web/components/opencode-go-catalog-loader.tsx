"use client";

import { useEffect } from "react";
import { ensureOpenCodeGoVisionCatalog } from "@nebula/core/opencode-go";

/** Prime OpenCode Go vision metadata for chat before settings are opened. */
export function OpenCodeGoCatalogLoader() {
  useEffect(() => {
    void ensureOpenCodeGoVisionCatalog();
  }, []);
  return null;
}
