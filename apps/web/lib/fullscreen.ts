export function isElementFullscreen(el: Element | null): boolean {
  if (!el) return false;
  return document.fullscreenElement === el;
}

export async function toggleElementFullscreen(
  el: HTMLElement | null,
): Promise<void> {
  if (!el) return;

  try {
    if (document.fullscreenElement === el) {
      await document.exitFullscreen();
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    await el.requestFullscreen();
  } catch {
    // Fullscreen may be denied or unsupported
  }
}
