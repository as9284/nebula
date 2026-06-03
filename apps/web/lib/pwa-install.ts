"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Chromium `beforeinstallprompt` event (not in all DOM lib versions). */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export type PwaInstallUiState =
  | "loading"
  | "installed"
  | "installable"
  | "ios"
  | "manual";

const SW_URL = "/sw.js";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installOutcome: "accepted" | "dismissed" | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribeInstallState(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // Legacy iOS Safari
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
  const isIpadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isAppleMobile || isIpadOs;
}

function getClientUiState(): PwaInstallUiState {
  if (typeof window === "undefined") return "loading";
  if (isStandaloneDisplay()) return "installed";
  if (deferredPrompt) return "installable";
  if (isIosSafari()) return "ios";
  return "manual";
}

export function registerPwaServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
    // Non-fatal — install UI still shows platform-specific guidance.
  });
}

export function initPwaInstallListeners(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    installOutcome = null;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installOutcome = "accepted";
    emit();
  });
}

export async function promptPwaInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  const prompt = deferredPrompt;
  deferredPrompt = null;
  emit();
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  installOutcome = outcome;
  emit();
  return outcome;
}

export function usePwaInstallState(): PwaInstallUiState {
  return useSyncExternalStore(subscribeInstallState, getClientUiState, () => "loading");
}

export function usePwaInstallActions() {
  const install = useCallback(async () => promptPwaInstall(), []);
  return { install };
}

export function getPwaInstallOutcome(): "accepted" | "dismissed" | null {
  return installOutcome;
}
