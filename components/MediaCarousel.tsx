"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import FormatBadge from "@/components/ui/FormatBadge";
import type { MediaItem } from "@/lib/media";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** The publisher favicon, falling back to a globe glyph if it fails to load. */
function Favicon({ domain, size = 16 }: { domain: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed || !domain) return <Globe size={size} className="text-faint" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={size}
      height={size}
      className="rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}

const cardCls =
  "flex h-[172px] w-[256px] shrink-0 snap-start flex-col rounded-[16px] border border-black/[0.07] bg-card p-4 text-left transition-shadow hover:shadow-[0_4px_16px_rgba(30,50,90,0.12)]";

/** A publisher link-preview that opens the real page in a new tab. The source
 *  name + format icon are tinted per category (blue news / green guidance). */
function LinkCard({ item, accentText }: { item: MediaItem; accentText: string }) {
  const domain = domainOf(item.url);
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className={cardCls}>
      {/* Source anchor */}
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-app">
          <Favicon domain={domain} size={18} />
        </span>
        <span className="truncate text-[12px] font-bold uppercase tracking-wide text-brand">
          {item.source}
        </span>
      </div>

      <p className="mt-2.5 line-clamp-3 text-[15px] font-bold leading-snug text-ink">
        {item.title}
      </p>

      {/* Resource type + timestamp/domain, at the bottom */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="truncate text-[12px] text-faint">{item.time ?? domain}</span>
        <FormatBadge format={item.format} iconClass={accentText} />
      </div>
    </a>
  );
}

/**
 * A grouped section card with a horizontal carousel of "Latest updates" (news)
 * or "Guidance resources". Cards are real publisher link-previews; scroll
 * horizontally by touch / trackpad.
 */
export default function MediaCarousel({
  title,
  items,
  accent,
}: {
  title: string;
  items: MediaItem[];
  accent: "blue" | "green";
}) {
  const accentText = accent === "green" ? "text-[#1a8f5e]" : "text-brand";
  return (
    <section className="rounded-[24px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)] sm:p-5">
      <h3 className="mb-3 text-[15px] font-extrabold text-ink">{title}</h3>

      {/* -mx-2/px-2/py-2 give the cards' rings + shadows room so the
          horizontal-scroll clip doesn't cut their borders. */}
      <div className="no-scrollbar -mx-2 flex snap-x gap-3 overflow-x-auto px-2 py-2">
        {items.map((item) => (
          <LinkCard key={item.id} item={item} accentText={accentText} />
        ))}
      </div>
    </section>
  );
}
