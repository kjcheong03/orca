"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Check, MapPin, Minus, RefreshCw, TrendingDown, TrendingUp, X } from "lucide-react";
import AdvisoryCarousel from "@/components/AdvisoryCarousel";
import AskOrcaChat from "@/components/AskOrcaChat";
import CalendarFab from "@/components/CalendarFab";
import HazardDropdown from "@/components/HazardDropdown";
import MediaCarousel from "@/components/MediaCarousel";
import Mascot from "@/components/Mascot";
import VideoResource from "@/components/VideoResource";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import ClusterMap from "@/components/ClusterMap";
import { useApp } from "@/context/AppContext";
import { useOnline, isOffline } from "@/lib/online";
import { readCache, saveCache } from "@/lib/offlineCache";
import { guidance, news, videos } from "@/lib/media";
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
  const { tx } = useApp();
  const tone = tierStyle[tier];
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ${tone.soft} ${tone.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      {tx(tierLabel[tier])}
    </span>
  );
}

/** The care recipient's conditions, joined with a localised "and". */
function localizedConditions(tx: (s: string) => string): string {
  return patient.conditions.map((c) => tx(c)).join(` ${tx("and")} `);
}

const cardCls = "rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]";
const shortName = patient.name.split(" ").slice(0, 2).join(" ");

type LangSuggestions = { suggestions: Suggestion[]; why: string };
// Cache AI suggestions per situation so re-renders / revisits don't regenerate;
// the reload button forces a fresh set.
const suggestionCache = new Map<string, Record<string, LangSuggestions>>();

function SuggestionsCard({ hazard, date, fallback }: { hazard: Hazard; date: string; fallback: LangSuggestions }) {
  const { tx, txf, lang } = useApp();
  const online = useOnline();
  const [whyOpen, setWhyOpen] = useState(false);
  const key = `${hazard}:${hazard === "covid" ? date : "live"}`;
  const persistKey = `suggestions:${key}`;
  const [data, setData] = useState<Record<string, LangSuggestions> | null>(() => suggestionCache.get(key) ?? null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (force: boolean) => {
    if (isOffline()) return; // AI generation needs the network — keep the cached/fallback copy
    setLoading(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hazard, date, force }),
      });
      if (res.ok) {
        const json = (await res.json()) as Record<string, LangSuggestions>;
        if (json && Object.keys(json).length) {
          suggestionCache.set(key, json);
          saveCache(persistKey, json); // survive reloads / show offline later
          setData(json);
        }
      }
    } catch {
      /* network dropped — keep whatever we have */
    } finally {
      setLoading(false);
    }
  }, [hazard, date, key, persistKey]);

  // Generate (or reuse cached) AI suggestions when the situation changes. Prefer
  // the in-memory cache, then the persisted (offline) cache, then fetch fresh.
  useEffect(() => {
    const mem = suggestionCache.get(key);
    if (mem) {
      setData(mem);
    } else {
      const persisted = readCache<Record<string, LangSuggestions>>(persistKey);
      if (persisted?.data) {
        suggestionCache.set(key, persisted.data);
        setData(persisted.data);
      } else {
        setData(null);
      }
    }
    void load(false); // self-guards offline
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // When the connection returns, fetch real suggestions if we only had the
  // bundled fallback (no AI data) while offline.
  useEffect(() => {
    if (online && !data) void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  useEffect(() => {
    if (!whyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWhyOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [whyOpen]);

  // AI content for the active language (English fallback); mock copy until loaded.
  const ai = data ? data[lang] ?? data.en ?? null : null;
  const suggestions = ai ? ai.suggestions : fallback.suggestions;
  const why = ai ? ai.why : fallback.why;

  return (
    <div className={cardCls}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-bold uppercase tracking-wider text-faint">
          {txf("For {name} today", { name: shortName })}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading || !online}
            aria-label={tx("Refresh suggestions")}
            title={tx("Refresh suggestions")}
            className="text-faint transition-colors hover:text-brand disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setWhyOpen(true)}
            className="text-[13px] font-semibold text-brand hover:underline"
          >
            {tx("Why?")}
          </button>
        </div>
      </div>

      {!online && (
        <p className="mt-2 text-[12px] font-medium text-faint">
          {tx(ai ? "Offline · showing saved tips" : "Offline · showing general tips")}
        </p>
      )}

      <ul className="mt-3 space-y-3.5">
        {suggestions.map((s) => (
          <li key={s.text} className="flex gap-3">
            <Check className="mt-0.5 shrink-0 text-check" size={20} strokeWidth={3} aria-hidden />
            <span className="text-[14px] leading-snug text-body">{ai ? s.text : tx(s.text)}</span>
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
              {tx("Why these suggestions?")}
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-body">{why}</p>
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
  const { tx } = useApp();
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

      {/* Topic switcher and date/location control share their own row so they
          never crowd the mascot below them. */}
      <div className="flex items-start justify-between gap-3">
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
        {isCovid ? (
          <CalendarFab
            value={date}
            min={dateBounds.min}
            max={dateBounds.max}
            updates={covidWeekly.map((p) => p.date)}
            onChange={handleDateChange}
          />
        ) : (
          <div className="flex min-w-0 max-w-[55%] items-center gap-2 rounded-full bg-card px-4 py-2 shadow-[0_2px_12px_rgba(30,50,90,0.06)]">
            <MapPin size={16} className="shrink-0 text-brand" />
            <span className="truncate text-[15px] font-semibold text-ink">{den!.area}</span>
          </div>
        )}
      </div>

      {/* Mascot, centered on its own and full-width so nothing overlaps it.
          Negative top margin tightens the gap to the control row above. */}
      <div className="-mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          aria-label="Ask ORCA"
          className="transition-transform active:scale-95"
        >
          <Mascot variant={mascot} size={168} />
        </button>
      </div>

      <div className="mx-auto w-full max-w-[300px]">
        <SegmentedToggle<"overview" | "resources">
          value={view}
          onChange={setView}
          options={[
            { value: "overview", label: tx("Overview") },
            { value: "resources", label: tx("Resources") },
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
            <MediaCarousel title={tx("Latest updates")} items={news[hazard]} accent="blue" />
            <MediaCarousel title={tx("Guidance resources")} items={guidance[hazard]} accent="green" />
            {videos[hazard] && <VideoResource {...videos[hazard]!} />}
          </>
        )}
      </motion.div>

      <AskOrcaChat open={chatOpen} onClose={() => setChatOpen(false)} hazard={hazard} date={date} />
    </div>
  );
}

function CovidCards({ date }: { date: string }) {
  const { tx, txf } = useApp();
  const s = getScenario("covid", date);
  const TrendIcon =
    s.trendDir === "rising" ? TrendingUp : s.trendDir === "easing" ? TrendingDown : Minus;
  const trendColor =
    s.trendDir === "rising"
      ? "text-danger"
      : s.trendDir === "easing"
        ? "text-[#1a8f5e]"
        : "text-faint";

  const elderlyStat = txf("{count} daily hospitalisations · {icu} in ICU", {
    count: Math.round(s.point.seniorHosp ?? 0),
    icu: Math.round(s.point.seniorIcu ?? 0),
  });
  const why = txf(
    "At {age} with {conditions}, COVID-19 is far more likely to need hospital or ICU care.",
    { age: patient.age, conditions: localizedConditions(tx) },
  );

  return (
    <>
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-faint">
            {s.source} · {s.friendlyDate}
          </p>
          <TierBadge tier={s.tier} />
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[26px] font-extrabold tracking-tight text-ink">
            {s.point.cases.toLocaleString("en-SG")}
          </span>
          <span className="text-[14px] text-muted">{tx("weekly cases")}</span>
          {s.trendPct !== null && (
            <span className={`flex items-center gap-0.5 text-[14px] font-semibold ${trendColor}`}>
              <TrendIcon size={15} />
              {Math.abs(s.trendPct)}%
            </span>
          )}
        </div>

        <p className="mt-1 text-[13px] text-muted">{elderlyStat}</p>
      </div>

      <SuggestionsCard hazard="covid" date={date} fallback={{ suggestions: s.suggestions, why }} />
    </>
  );
}

function DengueCards() {
  const { tx, txf } = useApp();
  const online = useOnline();
  const d = getDengueScenario();
  const why = txf(
    "At {age} with {conditions}, dengue can hit harder — higher bleeding risk and sudden blood-pressure drops.",
    { age: patient.age, conditions: localizedConditions(tx) },
  );

  return (
    <>
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-faint">
            NEA · {tx("Live")}
          </p>
          <TierBadge tier={d.tier} />
        </div>

        {/* isolate: contain Leaflet's internal z-index so its controls/tiles
            don't render over modals layered above the page. Offline, the live
            Mapbox tiles can't load, so fall back to the tile-free SVG map (the
            cluster data is bundled, so it works fully offline). */}
        <div className="isolate mt-3">
          {online ? (
            <ClusterMapLive home={HOME} />
          ) : (
            <div className="rounded-2xl bg-[#eef2fb] p-2">
              <ClusterMap home={HOME} clusters={d.clusters} />
            </div>
          )}
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
                  {txf("{cases} cases · {km} km", { cases: c.cases, km: c.distanceKm })}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[12px] text-faint">
          {txf("{count} clusters active · {cases} cases islandwide", {
            count: d.activeClusters,
            cases: d.totalCases,
          })}
        </p>
      </div>

      <SuggestionsCard hazard="dengue" date="" fallback={{ suggestions: d.suggestions, why }} />
    </>
  );
}
