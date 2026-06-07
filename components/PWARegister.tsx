"use client";

import { useEffect } from "react";

/** Registers the service worker so ORCA is installable + works offline. */
export default function PWARegister() {
  useEffect(() => {
    // Default to production only — a caching SW interferes with dev hot-reload.
    // Set NEXT_PUBLIC_ENABLE_SW=1 to opt in elsewhere (e.g. to test offline).
    const enabled =
      process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "1";
    if (!enabled) return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    // This effect frequently runs *after* the window `load` event has already
    // fired (React hydration can finish post-load), so a plain load listener
    // would miss it and never register. Register now if the page is already
    // loaded; otherwise wait for load.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
