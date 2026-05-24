import type { ActiveStreamPhase } from "@/stores/use-luna-store";

const ARTIFACT_IN_PROGRESS_RE =
  /```nebula-artifact|^\s*template\s*:\s*(react|html)\s*$/im;

export function inferStreamPhase(
  rawContent: string,
  displayContent: string,
): ActiveStreamPhase {
  if (displayContent.trim().length > 0) return "streaming";
  if (ARTIFACT_IN_PROGRESS_RE.test(rawContent)) return "building_ui";
  return "thinking";
}

export type StreamWatchdogOptions = {
  getAbortController: () => AbortController;
  onStatusHint: (hint: string | null) => void;
  stallHintMs?: number;
  stallAbortMs?: number;
  hardTimeoutMs?: number;
};

export function startStreamWatchdog({
  getAbortController,
  onStatusHint,
  stallHintMs = 22_000,
  stallAbortMs = 240_000,
  hardTimeoutMs = 300_000,
}: StreamWatchdogOptions): { stop: () => void; touch: () => void } {
  let lastActivityAt = Date.now();
  const startedAt = lastActivityAt;

  const touch = () => {
    lastActivityAt = Date.now();
  };

  const hardTimeout = setTimeout(() => {
    onStatusHint("Request timed out after 5 minutes. Try a smaller page or fewer sections.");
    getAbortController().abort();
  }, hardTimeoutMs);

  const interval = setInterval(() => {
    const idle = Date.now() - lastActivityAt;
    const total = Date.now() - startedAt;

    if (idle >= stallAbortMs) {
      onStatusHint(
        "Generation stalled. Try splitting the request (e.g. layout first, then styling).",
      );
      getAbortController().abort();
      return;
    }

    if (idle >= stallHintMs) {
      const seconds = Math.round(idle / 1000);
      onStatusHint(
        total > 90_000
          ? `Still working (${seconds}s since last update)… Large pages can take a few minutes. Use Stop to cancel.`
          : `Still generating (${seconds}s)… Building code and preview.`,
      );
      return;
    }

    onStatusHint(null);
  }, 4_000);

  const stop = () => {
    clearTimeout(hardTimeout);
    clearInterval(interval);
    onStatusHint(null);
  };

  return { stop, touch };
}
