"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * A round calendar button (FAB). Tapping it opens a month calendar constrained
 * to [min, max]. Dates carrying a new update are marked with a single blue dot
 * — the only update indicator. Picking any in-range day resolves to the nearest
 * update, so the selection always lands on a real update.
 */
export default function CalendarFab({
  value,
  min,
  max,
  updates,
  onChange,
}: {
  value: string; // selected ISO date
  min: string;
  max: string;
  updates?: string[]; // ISO dates that carry a new update
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const updateSet = new Set(updates ?? []);
  const hasUpdates = (updates?.length ?? 0) > 0;

  const nearestUpdate = (iso: string) => {
    if (!hasUpdates) return iso;
    const t = parse(iso).getTime();
    let best = updates![0];
    let bestDist = Infinity;
    for (const u of updates!) {
      const dist = Math.abs(parse(u).getTime() - t);
      if (dist < bestDist) {
        bestDist = dist;
        best = u;
      }
    }
    return best;
  };

  // The update actually shown is the nearest update date to `value`.
  const effective = nearestUpdate(value);
  const sel = parse(effective);
  const [view, setView] = useState({ y: sel.getFullYear(), m: sel.getMonth() });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const minD = parse(min);
  const maxD = parse(max);
  const monthStart = new Date(view.y, view.m, 1);
  const prevDisabled = monthStart <= new Date(minD.getFullYear(), minD.getMonth(), 1);
  const nextDisabled = monthStart >= new Date(maxD.getFullYear(), maxD.getMonth(), 1);

  const shift = (delta: number) => {
    const t = new Date(view.y, view.m + delta, 1);
    setView({ y: t.getFullYear(), m: t.getMonth() });
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const openCalendar = () => {
    const s = parse(effective);
    setView({ y: s.getFullYear(), m: s.getMonth() });
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openCalendar}
        aria-label="Choose date"
        className="grid h-12 w-12 place-items-center rounded-full bg-card text-brand shadow-[0_4px_14px_rgba(30,50,90,0.15)] ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95"
      >
        <CalendarDays size={22} />
      </button>

      {open && (
        <div
          className="fade-enter fixed inset-0 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose date"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="pop-enter relative w-full max-w-[340px] rounded-[28px] bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                disabled={prevDisabled}
                onClick={() => shift(-1)}
                aria-label="Previous month"
                className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-app disabled:opacity-30"
              >
                <ChevronLeft size={18} className="text-muted" />
              </button>
              <span className="text-[15px] font-bold text-ink">{monthLabel}</span>
              <button
                type="button"
                disabled={nextDisabled}
                onClick={() => shift(1)}
                aria-label="Next month"
                className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-app disabled:opacity-30"
              >
                <ChevronRight size={18} className="text-muted" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w, i) => (
                <span key={i} className="py-1 text-[11px] font-bold text-faint">
                  {w}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <span key={i} />;
                const iso = toIso(view.y, view.m, d);
                const inRange = iso >= min && iso <= max;
                const isUpdate = hasUpdates && updateSet.has(iso);
                const selected = iso === effective;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!inRange}
                    onClick={() => {
                      onChange(nearestUpdate(iso));
                      setOpen(false);
                    }}
                    className={`relative grid h-10 place-items-center rounded-xl text-[13.5px] transition-colors ${
                      selected
                        ? "bg-brand font-bold text-white"
                        : inRange
                          ? "font-medium text-ink hover:bg-app"
                          : "text-faint/40"
                    }`}
                  >
                    {d}
                    {isUpdate && !selected && (
                      <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
