"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Check, MapPin, Minus, TrendingDown, TrendingUp } from "lucide-react";
import Mascot from "@/components/Mascot";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
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
  return (
    <div className={cardCls}>
      <p className="text-[12px] font-bold uppercase tracking-wider text-faint">
        Tailored for {shortName}
      </p>
      <ul className="mt-3 space-y-3.5">
        {suggestions.map((s) => (
          <li key={s.text} className="flex gap-3">
            <Check className="mt-0.5 shrink-0 text-check" size={20} strokeWidth={3} aria-hidden />
            <span className="text-[14px] leading-snug text-body">
              {s.text}
              {s.because && (
                <span className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-brand-soft px-2 py-0.5 align-middle text-[11px] font-semibold text-brand">
                  {s.because}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] leading-snug text-faint">{why}</p>
    </div>
  );
}

export default function InfoScreen() {
  const [hazard, setHazard] = useState<Hazard>(defaultHazard);
  const [date, setDate] = useState(defaultDate);

  const isCovid = hazard === "covid";
  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const cov = isCovid ? getScenario("covid", date) : null;
  const den = isCovid ? null : getDengueScenario();
  const mascot = isCovid ? cov!.mascot : den!.mascot;

  // slider position = nearest COVID week to the selected date
  const t = Date.parse(date + "T00:00:00");
  let covIdx = 0;
  let bd = Infinity;
  covidWeekly.forEach((p, i) => {
    const dist = Math.abs(Date.parse(p.date) - t);
    if (dist < bd) {
      bd = dist;
      covIdx = i;
    }
  });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 pb-8 pt-4 lg:px-8 lg:pt-8">
      {/* Top control: date (COVID) or location (Dengue) — minimal centred pill */}
      <div className="flex justify-center">
        {isCovid ? (
          <div className="flex w-full max-w-[280px] flex-col items-center gap-3">
            <div className="relative flex w-[150px] items-center justify-center rounded-full bg-card px-3 py-2 shadow-[0_2px_12px_rgba(30,50,90,0.06)]">
              <span className="text-[15px] font-semibold text-ink">{dateLabel}</span>
              <input
                aria-label="Date"
                type="date"
                value={date}
                min={dateBounds.min}
                max={dateBounds.max}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <input
              aria-label="Scrub through the weeks"
              type="range"
              min={0}
              max={covidWeekly.length - 1}
              value={covIdx}
              onChange={(e) => setDate(covidWeekly[Number(e.target.value)].date)}
              className="w-full cursor-pointer [accent-color:var(--color-brand)]"
            />
          </div>
        ) : (
          <div className="flex w-fit items-center gap-2 rounded-full bg-card px-4 py-2 shadow-[0_2px_12px_rgba(30,50,90,0.06)]">
            <MapPin size={16} className="text-brand" />
            <span className="text-[15px] font-semibold text-ink">{den!.area}</span>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Mascot variant={mascot} size={150} />
      </div>

      <div className="mx-auto w-full max-w-[300px]">
        <SegmentedToggle<Hazard>
          value={hazard}
          onChange={setHazard}
          options={[
            { value: "covid", label: "COVID-19" },
            { value: "dengue", label: "Dengue" },
          ]}
        />
      </div>

      {isCovid ? <CovidCards date={date} /> : <DengueCards />}
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

        <div className="mt-3 flex items-baseline gap-2">
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

        <div className="mt-3">
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
