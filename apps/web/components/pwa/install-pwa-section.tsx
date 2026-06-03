"use client";

import { useState } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import {
  usePwaInstallActions,
  usePwaInstallState,
  type PwaInstallUiState,
} from "@/lib/pwa-install";
import { cn } from "@/lib/utils";

const PLATFORM_HINTS: Record<Exclude<PwaInstallUiState, "loading" | "installed">, string> = {
  installable: "Install Nebula on this device for a full-screen app with quick access from your home screen or dock.",
  ios: "On iPhone or iPad: tap Share in Safari, then Add to Home Screen.",
  manual:
    "Use your browser menu (Install app, Add to Home screen, or Install Nebula) to add Nebula as an app.",
};

export function InstallPwaSection() {
  const state = usePwaInstallState();
  const { install } = usePwaInstallActions();
  const [feedback, setFeedback] = useState("");

  if (state === "loading" || state === "installed") {
    return null;
  }

  const handleInstall = async () => {
    setFeedback("");
    if (state === "installable") {
      const outcome = await install();
      if (outcome === "accepted") {
        setFeedback("Installing Nebula…");
      } else if (outcome === "dismissed") {
        setFeedback("Install dismissed. You can try again anytime.");
      } else {
        setFeedback(PLATFORM_HINTS.manual);
      }
      return;
    }
    setFeedback(PLATFORM_HINTS[state]);
  };

  const showShareHint = state === "ios";

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-hover">
          <Smartphone size={14} className="text-text-secondary" aria-hidden />
        </div>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Install app
        </h2>
      </div>
      <p className="text-xs text-text-muted mb-4">{PLATFORM_HINTS[state]}</p>
      <button
        type="button"
        onClick={() => void handleInstall()}
        className={cn(
          "flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl",
          "bg-accent text-accent-fg text-sm font-medium",
          "hover:opacity-90 transition-opacity",
        )}
      >
        {showShareHint ? (
          <Share size={16} aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
        {state === "installable" ? "Install Nebula" : "How to install"}
      </button>
      {feedback && (
        <p className="mt-3 text-xs text-text-secondary bg-bg rounded-xl px-4 py-3 border border-border">
          {feedback}
        </p>
      )}
    </div>
  );
}
