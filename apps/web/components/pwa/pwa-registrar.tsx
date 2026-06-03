"use client";

import { useEffect } from "react";
import { initPwaInstallListeners, registerPwaServiceWorker } from "@/lib/pwa-install";

/** Registers the service worker and captures `beforeinstallprompt` for install UI. */
export function PwaRegistrar() {
  useEffect(() => {
    initPwaInstallListeners();
    registerPwaServiceWorker();
  }, []);

  return null;
}
