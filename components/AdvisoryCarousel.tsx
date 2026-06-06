"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Megaphone } from "lucide-react";
import { useApp } from "@/context/AppContext";

// How long each advisory stays on screen before sliding to the next.
const SLIDE_MS = 4200;

/** First sentence of the body, as a one-line preview (markdown stripped). */
function previewOf(body: string): string {
  const plain = body
    .replace(/^\s*\*\*[^*]+\*\*\s*/, "")        // drop the leading **Section** header
    .replace(/\*\*([^*]+)\*\*/g, "$1")          // bold → text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")     // [text](url) → text
    .replace(/\s+/g, " ")
    .trim();
  const first = plain.split(". ")[0].trim();
  return first.endsWith(".") ? first : `${first}.`;
}

/**
 * A vertical advisory slideshow pinned to the top of the Info screen. It shows
 * exactly one advisory at a time; on a timer the current one slides up and out
 * as the next slides up into its place. Tapping the card opens the full
 * broadcast sheet. Styled to match the original broadcast banner.
 */
export default function AdvisoryCarousel() {
  const { openBroadcast, tx, broadcasts, lang } = useApp();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = broadcasts.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  // No active advisories (the DB returned none) — show a calm empty state
  // rather than disappearing or showing stale mock content.
  if (!count) {
    return (
      <div className="flex h-[60px] w-full items-center gap-3 rounded-[16px] bg-card px-3 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <Megaphone size={18} className="text-slate-400" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-muted">
            {tx("No active advisories")}
          </span>
          <span className="block truncate text-[13px] text-faint">
            {tx("Official advisories will appear here when issued.")}
          </span>
        </span>
      </div>
    );
  }

  // `broadcasts` can shrink across refetches; clamp the index defensively.
  const current = broadcasts[index % count];
  // Show the caregiver's app-language version when available; else English.
  const content = lang !== "en" && current.translations?.[lang] ? current.translations[lang] : current;

  return (
    <button
      type="button"
      onClick={openBroadcast}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="View all advisories"
      className="relative block h-[60px] w-full overflow-hidden rounded-[16px] bg-card text-left shadow-[0_2px_14px_rgba(30,50,90,0.06)] transition-shadow hover:shadow-[0_4px_20px_rgba(30,50,90,0.1)]"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={current.id}
          initial={{ y: "110%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-110%" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center gap-3 px-3 pr-14"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand">
            <Megaphone size={18} className="text-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-bold text-ink">
              {tx(content.title)}
            </span>
            <span className="block truncate text-[13px] text-muted">
              {previewOf(content.body)}
            </span>
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Static chevron (clicks fall through to the card) */}
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
        <ChevronRight size={22} className="text-faint" />
      </span>
    </button>
  );
}
