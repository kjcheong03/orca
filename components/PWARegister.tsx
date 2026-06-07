"use client";

import { useEffect } from "react";

/** Registers the service worker so ORCA is installable + works offline.
 *
 *  Also handles the "user has the PWA open across a redeploy" case:
 *   - registration.update() fires on register + on every visibilitychange
 *     so we don't wait for the browser's lazy 24h check
 *   - the controllerchange listener reloads the page once when a fresh SW
 *     takes over, so the in-memory JS bundle matches the activated SW
 *  The SW itself uses skipWaiting + clients.claim so the new version is
 *  active immediately on install; the reload here is what lets the open
 *  page actually see it.
 */
export default function PWARegister() {
  useEffect(() => {
    // Default to production only — a caching SW interferes with dev hot-reload.
    // Set NEXT_PUBLIC_ENABLE_SW=1 to opt in elsewhere (e.g. to test offline).
    const enabled =
      process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "1";
    if (!enabled) return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      // Fires when navigator.serviceWorker.controller switches to a new SW
      // (i.e. clients.claim() in the new SW's activate handler). Reload once
      // so the JS in memory matches the active SW.
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let cleanupVisibility: (() => void) | null = null;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          // Make sure the browser never serves /sw.js from its HTTP cache —
          // every update check goes to the network. Vercel already sends
          // `Cache-Control: max-age=0, must-revalidate`, but this is the
          // belt-and-braces application-side flag.
          updateViaCache: "none",
        });
        // Immediate update check so a fresh visit doesn't wait for the
        // browser's lazy 24h check.
        reg.update().catch(() => {});

        // And whenever the tab regains focus (the most common "I just
        // re-opened the PWA after a deploy" case), check again.
        const onVisible = () => {
          if (document.visibilityState === "visible") {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", onVisible);
        cleanupVisibility = () => document.removeEventListener("visibilitychange", onVisible);
      } catch {
        // ignore — SW registration failures should not break the app
      }
    };

    // This effect frequently runs *after* the window `load` event has already
    // fired (React hydration can finish post-load), so a plain load listener
    // would miss it and never register. Register now if the page is already
    // loaded; otherwise wait for load.
    let removeLoad: (() => void) | null = null;
    if (document.readyState === "complete") {
      void register();
    } else {
      const onLoad = () => void register();
      window.addEventListener("load", onLoad, { once: true });
      removeLoad = () => window.removeEventListener("load", onLoad);
    }

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      cleanupVisibility?.();
      removeLoad?.();
    };
  }, []);
  return null;
}
