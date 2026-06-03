"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Globe } from "lucide-react";
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
function Favicon({ domain }: { domain: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !domain) return <Globe size={15} className="text-faint" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={16}
      height={16}
      className="rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}

const cardCls =
  "flex h-[164px] w-[252px] shrink-0 snap-start flex-col rounded-[16px] bg-card p-4 text-left ring-1 ring-black/[0.07] transition-shadow hover:shadow-[0_4px_16px_rgba(30,50,90,0.12)]";

/** A publisher link-preview that opens the real page in a new tab. */
function LinkCard({ item }: { item: MediaItem }) {
  const domain = domainOf(item.url);
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className={cardCls}>
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-app">
          <Favicon domain={domain} />
        </span>
        <span className="truncate text-[12px] font-bold uppercase tracking-wide text-brand">
          {item.source}
        </span>
        <span className="ml-auto shrink-0">
          <FormatBadge format={item.format} />
        </span>
      </div>

      <p className="mt-2.5 line-clamp-3 text-[14.5px] font-bold leading-snug text-ink">
        {item.title}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="truncate text-[12px] text-faint">{item.time ?? domain}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-brand">
          {item.time ? "Read" : "Open"}
          <ExternalLink size={13} />
        </span>
      </div>
    </a>
  );
}

/**
 * A grouped section card with a horizontal carousel of "Latest updates" (news)
 * or "Guidance resources". Cards are real publisher link-previews; desktop gets
 * prev/next arrows.
 */
export default function MediaCarousel({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: MediaItem[];
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const nudge = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="rounded-[24px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)] sm:p-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-extrabold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p>}
        </div>
        <div className="hidden gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Scroll left"
            className="grid h-8 w-8 place-items-center rounded-full bg-app text-muted transition-colors hover:text-ink"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label="Scroll right"
            className="grid h-8 w-8 place-items-center rounded-full bg-app text-muted transition-colors hover:text-ink"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div ref={scroller} className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <LinkCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
