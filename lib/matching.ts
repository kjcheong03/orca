// ---------------------------------------------------------------------------
// MVP partner matching for the community help flow (Phase 3).
//
// Ranks partner organisations for a single support task using only:
//   capability match · area match · availability/capacity/stock · suitability.
// No scoring history, preferences, or continuity logic — deliberately simple.
// ---------------------------------------------------------------------------

import {
  organisations,
  type CostEstimate,
  type Organisation,
  type SupportTypeId,
  type TaskDraft,
} from "./community";
import { calculateTaskCost } from "./cost";

/** Maps a supplies subtype to its stock-inventory key. */
const STOCK_KEY: Record<string, string> = {
  Repellent: "repellent",
  Masks: "masks",
  "ART kits": "ART kits",
  Thermometer: "thermometers",
  "Hand sanitiser": "handSanitiser",
  Soap: "soap",
  "Cleaning wipes": "cleaningWipes",
};

export interface PartnerMatch {
  org: Organisation;
  score: number;
  /** Relevant metric (stock or slots) used for relative tags. */
  metric: number;
  reasons: string[];
  /** Meets the task's hard requirements (e.g. wheelchair). */
  suitable: boolean;
  /** Serves the area, can fulfil the need, and has stock/availability. */
  qualified: boolean;
  /** Estimated cost for this task with this partner. */
  cost?: CostEstimate;
  /** Short reason it's unsuitable, if any. */
  note?: string;
}

/** Sort key: cheaper first; free = 0; unknown/partner-review last. */
function costKey(est?: CostEstimate): number {
  if (!est || est.costType === "partnerReview") return Number.MAX_SAFE_INTEGER;
  if (est.costType === "free") return 0;
  if (est.total != null) return est.total;
  if (est.min != null) return est.min;
  return Number.MAX_SAFE_INTEGER;
}

export interface MatchResult {
  ranked: PartnerMatch[];
  primaryId: string | null;
  fallbackId: string | null;
}

function num(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

function taskArea(task: TaskDraft): string {
  const d = task.details;
  return (d.pickupArea as string) || (d.area as string) || "Ang Mo Kio";
}

function servesArea(org: Organisation, area: string): boolean {
  return org.serviceAreas.some((a) => a === area || a.startsWith(area));
}

function evaluate(task: TaskDraft, org: Organisation): PartnerMatch {
  const subs = task.selectedSubtypes;
  let score = 0;
  let metric = 0;
  const reasons: string[] = [];
  let suitable = true;
  let note: string | undefined;

  // 1. Capability — how many chosen subtypes this partner can handle.
  const covered = subs.filter((s) => org.supportSubtypes.includes(s));
  score += covered.length * 3;
  if (subs.length > 0 && covered.length === subs.length) score += 2;

  // 2. Area.
  const area = taskArea(task);
  const inArea = servesArea(org, area);
  if (inArea) {
    score += 4;
    reasons.push("Covers your area");
  }

  // 3 + 4. Availability / capacity / stock + suitability.
  switch (task.supportType) {
    case "supplies": {
      for (const s of subs) {
        const key = STOCK_KEY[s];
        if (key) metric += num(org.stockInventory?.[key]);
      }
      score += Math.min(metric, 200) / 20;
      if (metric > 0) reasons.push("Has stock");
      // Prefer the nearby local hub for everyday supplies it can actually stock.
      if (org.tags.includes("nearby") && servesArea(org, area) && metric > 0) score += 6;
      break;
    }
    case "food": {
      metric = num(org.capacity["meal slots today"]);
      score += metric;
      if (metric > 0) reasons.push("Available today");
      break;
    }
    case "welfare": {
      metric = num(org.capacity["welfare check slots today"]);
      score += metric;
      if (metric > 0) reasons.push("Available today");
      if (task.details.checkMethod === "Home visit") {
        if (org.supportSubtypes.includes("Home visit")) {
          score += 3;
          reasons.push("Supports home visits");
        } else {
          suitable = false;
          note = "Doesn't do home visits";
        }
      }
      break;
    }
    case "transport": {
      metric = num(org.capacity["transport slots today"]);
      const wheelchairSlots = num(org.capacity["wheelchair-capable slots today"]);
      score += metric;
      const needsWheelchair =
        task.details.wheelchairRequired === true ||
        subs.includes("Wheelchair-friendly transport");
      if (needsWheelchair) {
        if (wheelchairSlots > 0) {
          score += 5;
          reasons.push("Wheelchair-capable");
        } else {
          suitable = false;
          note = "Not wheelchair-capable";
        }
      } else if (metric > 0) {
        reasons.push("Available today");
      }
      break;
    }
    case "referral": {
      metric =
        num(org.capacity["navigation callback slots today"]) ||
        num(org.capacity["welfare check slots today"]);
      score += metric;
      if (metric > 0) reasons.push("Available today");
      break;
    }
  }

  if (org.status === "busy") score -= 1;
  if (org.limitations.some((l) => /confirm/i.test(l))) reasons.push("Partner confirmation needed");

  // Area + availability gate for the "qualified" tier (capability is handled by
  // support-type eligibility; reason-based subtypes aren't a capability filter).
  const qualified = suitable && inArea && metric > 0;

  return { org, score, metric, reasons, suitable, qualified, note };
}

/** Rank eligible partners for a task; pick primary + fallback. */
export function matchPartners(
  task: TaskDraft,
  partners: Organisation[] = organisations,
): MatchResult {
  const eligible = partners.filter(
    (o) => o.status !== "unavailable" && o.supportTypes.includes(task.supportType),
  );

  const ranked = eligible
    .map((o) => {
      const m = evaluate(task, o);
      m.cost = calculateTaskCost(task, o);
      return m;
    })
    // Eligible (capability + area + availability) first, then cheapest first.
    .sort(
      (a, b) =>
        Number(b.suitable) - Number(a.suitable) ||
        Number(b.qualified) - Number(a.qualified) ||
        costKey(a.cost) - costKey(b.cost) ||
        b.score - a.score,
    );

  // De-duplicate + cap reason tags; ensure every partner has at least one.
  for (const m of ranked) {
    m.reasons = [...new Set(m.reasons)].slice(0, 3);
    if (m.reasons.length === 0) m.reasons = ["Handles this request"];
  }

  return {
    ranked,
    primaryId: ranked[0]?.org.id ?? null,
    fallbackId: ranked[1]?.org.id ?? null,
  };
}

/** A short, human capacity/stock line for an org + task (used in cards). */
export function capacitySummary(
  org: Organisation,
  type: SupportTypeId,
  subtypes: string[],
): string {
  switch (type) {
    case "supplies": {
      const parts = subtypes
        .map((s) => {
          const key = STOCK_KEY[s];
          const n = key ? num(org.stockInventory?.[key]) : undefined;
          return key && n !== undefined ? `${s}: ${n}` : null;
        })
        .filter(Boolean) as string[];
      return parts.length ? parts.join(" · ") : "Stock on request";
    }
    case "food":
      return `Meal slots today: ${num(org.capacity["meal slots today"])}`;
    case "welfare":
      return `Welfare slots today: ${num(org.capacity["welfare check slots today"])}`;
    case "transport": {
      const t = num(org.capacity["transport slots today"]);
      const w = num(org.capacity["wheelchair-capable slots today"]);
      return w > 0 ? `Transport slots: ${t} · Wheelchair: ${w}` : `Transport slots: ${t}`;
    }
    case "referral":
      return `Callback slots today: ${
        num(org.capacity["navigation callback slots today"]) ||
        num(org.capacity["welfare check slots today"])
      }`;
    default:
      return "";
  }
}
