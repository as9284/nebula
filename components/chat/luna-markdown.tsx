"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { Components } from "react-markdown";
import { linkifyCitations } from "@/lib/search-format";
import type { SearchSource } from "@/types/search";

interface LunaMarkdownProps {
  content: string;
  sources?: SearchSource[];
}

const components: Components = {
  a: ({ href, children, title }) => (
    <a
      href={href}
      title={title ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="luna-citation-link"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="luna-table-wrap">
      <table>{children}</table>
    </div>
  ),
  blockquote: ({ children }) => (
    <blockquote className="luna-callout">{children}</blockquote>
  ),
};

export function LunaMarkdown({
  content,
  sources = [],
}: LunaMarkdownProps) {
  const processed = linkifyCitations(content, sources);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
      {processed}
    </ReactMarkdown>
  );
}
