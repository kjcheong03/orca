"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Check, MapPin, Minus, TrendingDown, TrendingUp, X } from "lucide-react";
import AdvisoryCarousel from "@/components/AdvisoryCarousel";
import AskCaraChat from "@/components/AskCaraChat";
import CalendarFab from "@/components/CalendarFab";
import HazardDropdown from "@/components/HazardDropdown";
import MediaCarousel from "@/components/MediaCarousel";
import Mascot from "@/components/Mascot";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import { guidance, news } from "@/lib/media";
import { patient } from "@/lib/data";
import { getDengueScenario, HOME } from "@/lib/dengue";
import { covidWeekly } from "@/lib/outbreaks";
import {
  dateBounds,
  defaultDate,
  defaultHazard,
  getScenario,
  tierLabel,
  type Hazard,
  type Suggestion,
  type Tier,
} from "@/lib/scenario";

// Leaflet touches `window`, so load the map client-only.
const ClusterMapLive = dynamic(() => import("@/components/ClusterMapLive"), {
  ssr: false,
  loading: () => <div className="h-[380px] animate-pulse rounded-2xl bg-app" />,
});

const tierStyle: Record<Tier, { text: string; dot: string; soft: string }> = {
  low: { text: "text-[#1a8f5e]", dot: "bg-[#1a8f5e]", soft: "bg-[#e6f5ee]" },
  moderate: { text: "text-warn", dot: "bg-warn", soft: "bg-warn-soft" },
  high: { text: "text-[#d9480f]", dot: "bg-[#d9480f]", soft: "bg-[#fde7d9]" },
  veryhigh: { text: "text-danger", dot: "bg-danger", soft: "bg-danger-soft" },
};

function TierBadge({ tier }: { tier: Tier }) {
  const tone = tierStyle[tier];
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold ${tone.soft} ${tone.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      {tierLabel[tier]}
    </span>
  );
}

const cardCls = "rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]";
const shortName = patient.name.split(" ").slice(0, 2).join(" ");

function SuggestionsCard({ suggestions, why }: { suggestions: Suggestion[]; why: string }) {
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => {
    if (!whyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWhyOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [whyOpen]);

  return (
    <div className={cardCls}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-bold uppercase tracking-wider text-faint">
          For {shortName} today
        </p>
        <button
          type="button"
          onClick={() => setWhyOpen(true)}
          className="shrink-0 text-[13px] font-semibold text-brand hover:underline"
        >
          Why?
        </button>
      </div>

      <ul className="mt-3 space-y-3.5">
        {suggestions.map((s) => (
          <li key={s.text} className="flex gap-3">
            <Check className="mt-0.5 shrink-0 text-check" size={20} strokeWidth={3} aria-hidden />
            <span className="text-[14px] leading-snug text-body">{s.text}</span>
          </li>
        ))}
      </ul>

      {whyOpen && (
        <div
          className="fade-enter fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="why-title"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setWhyOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="pop-enter relative w-full max-w-md rounded-[28px] bg-card p-6">
            <button
              type="button"
              onClick={() => setWhyOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-app shadow-sm"
            >
              <X size={18} className="text-ink" />
            </button>
            <h2 id="why-title" className="display pr-10 text-[19px] text-ink">
              Why these suggestions?
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-body">{why}</p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-faint">
              CARA tailors these to {shortName}&apos;s age and conditions. Detailed
              reasoning is a work in progress.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** A pulsing placeholder shown for a split second while the day switches. */
function SwitchingSkeleton() {
  return (
    <>
      <div className={`${cardCls} animate-pulse`}>
        <div className="flex items-center justify-between gap-3">
          <div className="h-3 w-28 rounded bg-black/10" />
          <div className="h-6 w-20 rounded-full bg-black/10" />
        </div>
        <div className="mt-2 h-7 w-40 rounded bg-black/10" />
        <div className="mt-3 h-3 w-56 rounded bg-black/10" />
      </div>
      <div className={`${cardCls} animate-pulse`}>
        <div className="h-3 w-32 rounded bg-black/10" />
        <div className="mt-4 space-y-3.5">
          <div className="h-3 w-full rounded bg-black/10" />
          <div className="h-3 w-11/12 rounded bg-black/10" />
          <div className="h-3 w-10/12 rounded bg-black/10" />
          <div className="h-3 w-9/12 rounded bg-black/10" />
        </div>
      </div>
    </>
  );
}

export default function InfoScreen() {
  const [hazard, setHazard] = useState<Hazard>(defaultHazard);
  const [date, setDate] = useState(defaultDate);
  const [chatOpen, setChatOpen] = useState(false);
  const [view, setView] = useState<"overview" | "resources">("overview");
  const [switching, setSwitching] = useState(false);

  // Briefly show a ghost card when the date changes, so switching days is obvious.
  const handleDateChange = (d: string) => {
    setDate(d);
    setSwitching(true);
    window.setTimeout(() => setSwitching(false), 350);
  };

  const isCovid = hazard === "covid";
  const cov = isCovid ? getScenario("covid", date) : null;
  const den = isCovid ? null : getDengueScenario();
  const mascot = isCovid ? cov!.mascot : den!.mascot;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 pb-8 pt-4 lg:px-8 lg:pt-8">
      {/* Active advisories — vertical slideshow, opens the broadcast sheet */}
      <AdvisoryCarousel />

      {/* Mascot, with the top control (calendar FAB / location pill) floated to
          the right and flush with the mascot's top. */}
      <div className="relative flex justify-center">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          aria-label="Ask CARA"
          className="transition-transform active:scale-95"
        >
          <Mascot variant={mascot} size={168} />
        </button>
        <div className="absolute left-0 top-0">
          <HazardDropdown<Hazard>
            value={hazard}
            onChange={setHazard}
            options={[
              {
                value: "covid",
                label: "COVID-19",
                dot: tierStyle[(cov ?? getScenario("covid", date)).tier].dot,
              },
              {
                value: "dengue",
                label: "Dengue",
                dot: tierStyle[(den ?? getDengueScenario()).tier].dot,
              },
            ]}
          />
        </div>
        <div className="absolute right-0 top-0">
          {isCovid ? (
            <CalendarFab
              value={date}
              min={dateBounds.min}
              max={dateBounds.max}
              updates={covidWeekly.map((p) => p.date)}
              onChange={handleDateChange}
            />
          ) : (
            <div className="flex w-fit items-center gap-2 rounded-full bg-card px-4 py-2 shadow-[0_2px_12px_rgba(30,50,90,0.06)]">
              <MapPin size={16} className="text-brand" />
              <span className="text-[15px] font-semibold text-ink">{den!.area}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[300px]">
        <SegmentedToggle<"overview" | "resources">
          value={view}
          onChange={setView}
          options={[
            { value: "overview", label: "Overview" },
            { value: "resources", label: "Resources" },
          ]}
        />
      </div>

      {/* Float the widgets up to position on tab/topic change and first load */}
      <motion.div
        key={`${view}-${hazard}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-5"
      >
        {view === "overview" ? (
          isCovid ? (
            switching ? (
              <SwitchingSkeleton />
            ) : (
              <CovidCards date={date} />
            )
          ) : (
            <DengueCards />
          )
        ) : (
          <>
            <MediaCarousel title="Latest updates" items={news[hazard]} accent="blue" />
            <MediaCarousel title="Guidance resources" items={guidance[hazard]} accent="green" />
          </>
        )}
      </motion.div>

      <AskCaraChat open={chatOpen} onClose={() => setChatOpen(false)} hazard={hazard} />
    </div>
  );
}

function CovidCards({ date }: { date: string }) {
  const s = getScenario("covid", date);
  const TrendIcon =
    s.trendDir === "rising" ? TrendingUp : s.trendDir === "easing" ? TrendingDown : Minus;
  const trendColor =
    s.trendDir === "rising"
      ? "text-danger"
      : s.trendDir === "easing"
        ? "text-[#1a8f5e]"
        : "text-faint";

  return (
    <>
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-faint">
            {s.source} · {s.friendlyDate}
          </p>
          <TierBadge tier={s.tier} />
        </div>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[26px] font-extrabold tracking-tight text-ink">
            {s.point.cases.toLocaleString("en-SG")}
          </span>
          <span className="text-[14px] text-muted">weekly cases</span>
          {s.trendPct !== null && (
            <span className={`flex items-center gap-0.5 text-[14px] font-semibold ${trendColor}`}>
              <TrendIcon size={15} />
              {Math.abs(s.trendPct)}%
            </span>
          )}
        </div>

        <p className="mt-1 text-[13px] text-muted">{s.elderlyStat}</p>
      </div>

      <SuggestionsCard suggestions={s.suggestions} why={s.why} />
    </>
  );
}

function DengueCards() {
  const d = getDengueScenario();

  return (
    <>
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-faint">
            NEA · Live
          </p>
          <TierBadge tier={d.tier} />
        </div>

        {/* isolate: contain Leaflet's internal z-index so its controls/tiles
            don't render over modals layered above the page. */}
        <div className="isolate mt-3">
          <ClusterMapLive home={HOME} />
        </div>

        <ul className="mt-3 space-y-3">
          {d.clusters.slice(0, 3).map((c) => (
            <li key={c.locality} className="flex items-start gap-3">
              <MapPin size={17} className="mt-0.5 shrink-0 text-danger" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-snug text-ink">
                  {c.locality}
                </span>
                <span className="text-[12px] text-faint">
                  {c.cases} cases · {c.distanceKm} km
                </span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[12px] text-faint">
          {d.activeClusters} clusters active · {d.totalCases} cases islandwide
        </p>
      </div>

      <SuggestionsCard suggestions={d.suggestions} why={d.why} />
    </>
  );
}
