// ---------------------------------------------------------------------------
// MVP partner matching for the community help flow (Phase 3).
//
// Ranks partner organisations for a single support task using only:
//   capability match · area match · availability/capacity/stock · suitability.
// No scoring history, preferences, or continuity logic — deliberately simple.
// ---------------------------------------------------------------------------

import {
  FOOD_ROUTES,
  getOrganisation,
  organisations,
  SUPPLY_ROUTES,
  type CostEstimate,
  type FulfilmentRoute,
  type ItemQuantity,
  type Organisation,
  type SupportTypeId,
  type TaskDraft,
} from "./community";
import { calculateTaskCost, costDetail, formatCostEstimate } from "./cost";

/**
 * Item/subtype-level routing for supplies and food. Supplies map each item to
 * an episodic public/community distribution exercise; food maps each subtype to
 * the real partner service that fulfils it. Returns null for single-partner
 * support types (welfare, transport, referral), which use matchPartners.
 */
export function routeRequest(task: TaskDraft): FulfilmentRoute[] | null {
  if (task.supportType === "supplies") {
    const items = Array.isArray(task.details.itemsNeeded)
      ? (task.details.itemsNeeded as ItemQuantity[])
      : [];
    return items.map((it) => {
      const qty = Number(it.quantity) || 1;
      const r = SUPPLY_ROUTES[it.item];
      if (!r) {
        return {
          label: it.item,
          quantity: qty,
          routeName: "No active community route",
          routeType: "community_distribution",
          availabilityMode: "unavailable",
          costLabel: "—",
          status: "No active community route available for this item",
        };
      }
      return {
        label: it.item,
        quantity: qty,
        routeName: r.routeName,
        logo: r.logo,
        routeType: r.routeType,
        availabilityMode: r.availabilityMode,
        costLabel: r.costLabel,
        status: r.status,
      };
    });
  }

  if (task.supportType === "food") {
    return task.selectedSubtypes.map((sub) => {
      const org = getOrganisation(FOOD_ROUTES[sub] ?? "");
      if (!org) {
        return {
          label: sub,
          routeName: "No active route",
          routeType: "partner_service",
          availabilityMode: "unavailable",
          costLabel: "—",
          status: "No partner available for this item",
        };
      }
      const est = calculateTaskCost(
        { supportType: "food", selectedSubtypes: [sub], details: task.details },
        org,
      );
      return {
        label: sub,
        routeName: org.name,
        logo: org.logo,
        organisationId: org.id,
        routeType: "partner_service",
        availabilityMode: "partner_assessment",
        costLabel: formatCostEstimate(est),
        detail: costDetail(est),
        status: "",
      };
    });
  }

  return null;
}

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

  // 3 + 4. Availability / capacity + suitability.
  // Supplies + food are handled by routeRequest(), not partner matching.
  switch (task.supportType) {
    case "food": {
      // Capability is real here: cooked meals vs food packs go to different partners.
      const covers = subs.some((s) => org.supportSubtypes.includes(s));
      if (!covers) {
        suitable = false;
        note = "Doesn't provide this kind of food support";
        break;
      }
      metric =
        num(org.capacity["meal slots today"]) || num(org.capacity["food pack slots today"]);
      score += metric;
      break;
    }
    case "welfare": {
      metric = num(org.capacity["welfare check slots today"]);
      score += metric;
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
      reasons.push("Assisted transport");
      const needsWheelchair =
        task.details.wheelchairRequired === true ||
        subs.includes("Wheelchair-accessible transport");
      if (needsWheelchair) {
        if (wheelchairSlots > 0) {
          score += 5;
          reasons.push("Wheelchair support");
        } else {
          suitable = false;
          note = "Wheelchair support not available";
        }
      }
      break;
    }
    case "referral": {
      metric =
        num(org.capacity["navigation callback slots today"]) ||
        num(org.capacity["welfare check slots today"]);
      score += metric;
      break;
    }
  }

  if (org.status === "busy") score -= 1;

  // Area + availability gate for the "qualified" tier.
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

  // Primary must be a suitable partner; if none are suitable, there's no match.
  const suitableIds = ranked.filter((m) => m.suitable).map((m) => m.org.id);
  return {
    ranked,
    primaryId: suitableIds[0] ?? null,
    fallbackId: suitableIds[1] ?? null,
  };
}

/** A short, human capacity/stock line for an org + task (used in cards). */
export function capacitySummary(
  org: Organisation,
  type: SupportTypeId,
  subtypes: string[],
): string {
  switch (type) {
    case "supplies":
      return "Routed to active distribution exercises";
    case "food": {
      const m = num(org.capacity["meal slots today"]);
      const p = num(org.capacity["food pack slots today"]);
      return p > 0 ? `Food pack slots today: ${p}` : `Meal slots today: ${m}`;
    }
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
