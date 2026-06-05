"use client";

import { useEffect } from "react";

/** Registers the service worker so CARA is installable + works offline. */
export default function PWARegister() {
  useEffect(() => {
    // Only in production — a caching SW interferes with dev hot-reload.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
