"use client";

import { useMemo } from "react";
import type { CodeArtifact } from "@/types/chat";

function injectBeforeClose(
  html: string,
  tag: "head" | "body",
  snippet: string,
): string {
  const close = new RegExp(`</${tag}>`, "i");
  if (close.test(html)) {
    return html.replace(close, `${snippet}</${tag}>`);
  }
  return html;
}

export function buildHtmlSrcDoc(artifact: CodeArtifact): string {
  const { files, entry } = artifact;
  const htmlPath =
    entry && files[entry]?.includes("<")
      ? entry
      : Object.keys(files).find((p) => p.endsWith(".html")) ?? entry ?? "/index.html";

  let html = files[htmlPath] ?? files["/index.html"] ?? "";
  const css = files["/styles.css"] ?? "";
  const js = files["/script.js"] ?? files["/index.js"] ?? "";

  if (css) {
    const styleTag = `<style>\n${css}\n</style>`;
    if (/<head[\s>]/i.test(html)) {
      html = injectBeforeClose(html, "head", styleTag);
    } else {
      html = `<!DOCTYPE html><html><head>${styleTag}</head><body>${html}</body></html>`;
    }
  }

  if (js) {
    const scriptTag = `<script>\n${js}\n</script>`;
    if (/<body[\s>]/i.test(html)) {
      html = injectBeforeClose(html, "body", scriptTag);
    } else {
      html += scriptTag;
    }
  }

  if (!/<!DOCTYPE/i.test(html) && !/<html[\s>]/i.test(html)) {
    html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  }

  return html;
}

interface HtmlArtifactPreviewProps {
  artifact: CodeArtifact;
}

export function HtmlArtifactPreview({ artifact }: HtmlArtifactPreviewProps) {
  const srcDoc = useMemo(() => buildHtmlSrcDoc(artifact), [artifact]);

  return (
    <iframe
      title={artifact.title ?? "HTML preview"}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="h-[min(360px,50vh)] w-full border-0 bg-white"
    />
  );
}
