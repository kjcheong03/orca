"use client";

import { useMemo } from "react";
import { ChevronRight, Megaphone } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { filterBroadcastsForProfile } from "@/lib/broadcasts";
import { loadActiveProfile } from "@/lib/profiles";

/** One-line preview of a broadcast body for the banner. */
function previewOf(body: string): string {
  const clean = body.replace(/\s+/g, " ").trim();
  return clean.length > 90 ? `${clean.slice(0, 89).trimEnd()}…` : clean;
}

export default function BroadcastBanner() {
  const { openBroadcast, tx, broadcasts: rawBroadcasts, lang } = useApp();

  // The currently-selected elderly profile drives audience filtering. During
  // SSR loadActiveProfile returns the seed patient (matchedTargets ["Heart",
  // "Diabetes"]) — that's fine; the client re-renders with the real value.
  const activeProfile = useMemo(() => loadActiveProfile(), []);
  const visible = useMemo(
    () => filterBroadcastsForProfile(rawBroadcasts, activeProfile.matchedTargets ?? []),
    [rawBroadcasts, activeProfile.matchedTargets],
  );

  // Derive the headline from the filtered list — fall back to an empty banner
  // (matching the existing empty/no-broadcast state) when nothing matches this
  // profile's audience.
  const top = visible[0];
  const topContent = top
    ? lang !== "en" && top.translations?.[lang]
      ? top.translations[lang]
      : { title: top.title, body: top.body }
    : null;
  const bannerBroadcast = topContent
    ? { title: topContent.title, preview: previewOf(topContent.body) }
    : { title: "", preview: "" };

  return (
    <button
      type="button"
      onClick={openBroadcast}
      className="flex w-full items-center gap-4 rounded-[20px] bg-card p-3.5 text-left shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand">
        <Megaphone size={26} className="text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold text-ink">
          {tx(bannerBroadcast.title)}
        </span>
        <span className="block truncate text-[13px] text-muted">
          {tx(bannerBroadcast.preview)}
        </span>
      </span>
      <ChevronRight size={24} className="shrink-0 text-faint" />
    </button>
  );
}
