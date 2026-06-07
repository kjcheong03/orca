"use client";

import { useEffect, useState } from "react";

/**
 * Reactive online/offline state. SSR and the first client paint assume online
 * (so the offline banner never flashes during hydration); the real value is
 * read in an effect and then kept in sync with the browser's online/offline
 * events.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}

/** Non-reactive check for use outside React (e.g. before a fetch). */
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
