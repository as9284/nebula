"use client";

import { ExternalLink } from "lucide-react";
import { hostnameFromUrl } from "@/lib/search-format";
import type { SearchSource } from "@/types/search";

interface MessageSourcesProps {
  sources: SearchSource[];
}

export function MessageSources({ sources }: MessageSourcesProps) {
  if (!sources.length) return null;

  return (
    <section
      className="mt-5 pt-4 border-t border-border/70"
      aria-label={`${sources.length} sources`}
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Sources
        </h4>
        <span className="text-[11px] tabular-nums text-text-muted">
          {sources.length}
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:thin]">
        {sources.map((source) => {
          const domain = hostnameFromUrl(source.url);
          return (
            <a
              key={source.index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="luna-source-card group snap-start shrink-0 w-[min(100%,14.5rem)] sm:w-[15.5rem] flex flex-col gap-2 p-3 rounded-xl border transition-colors duration-150"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="luna-source-badge shrink-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-semibold tabular-nums"
                  aria-hidden
                >
                  {source.index}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element -- external favicon */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`}
                  alt=""
                  width={14}
                  height={14}
                  className="shrink-0 rounded-sm opacity-80"
                  loading="lazy"
                />
                <span className="min-w-0 flex-1 truncate text-[11px] text-text-muted">
                  {domain}
                </span>
                <ExternalLink
                  size={12}
                  className="shrink-0 text-text-muted opacity-0 group-hover:opacity-70 transition-opacity"
                  aria-hidden
                />
              </div>
              <p className="text-[13px] font-medium leading-snug text-text-primary line-clamp-2">
                {source.title}
              </p>
              {source.publishedDate ? (
                <p className="text-[10px] text-text-muted truncate">
                  {source.publishedDate}
                </p>
              ) : null}
            </a>
          );
        })}
      </div>
    </section>
  );
}
