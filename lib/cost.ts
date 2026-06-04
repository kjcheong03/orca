// ---------------------------------------------------------------------------
// Cost estimation for the community help flow (mock, transparency only).
// No payment logic — partners arrange payment directly.
// ---------------------------------------------------------------------------

import type {
  CostBreakdownLine,
  CostEstimate,
  ItemQuantity,
  Offering,
  Organisation,
  SupportTypeId,
} from "./community";

interface CostTask {
  supportType: SupportTypeId;
  selectedSubtypes: string[];
  details: Record<string, unknown>;
}

const SUPPLY_KEY: Record<string, string> = {
  Repellent: "repellent",
  Masks: "masks",
  "ART kits": "artKits",
  Thermometer: "thermometer",
  "Hand sanitiser": "handSanitiser",
  Soap: "soap",
  "Cleaning wipes": "cleaningWipes",
};
const FOOD_KEY: Record<string, string> = {
  "Cooked meals": "cookedMeal",
};

/** The offering a partner has for a given supplies item label, if any. */
export function getOfferingForTaskItem(itemLabel: string, partner: Organisation): Offering | undefined {
  return partner.offerings.supplies?.[SUPPLY_KEY[itemLabel]];
}

/** Compute a structured cost estimate for a task fulfilled by a partner. */
export function calculateTaskCost(task: CostTask, partner: Organisation): CostEstimate {
  // Food packs / rations are not priced item-by-item — the partner assesses
  // eligibility and confirms what can be provided. No grocery price estimate.
  if (task.supportType === "food" && task.selectedSubtypes[0] === "Food pack / rations") {
    const packs =
      task.details.numberOfPacks === "Other"
        ? Number(task.details.numberOfPacksOther) || 1
        : parseInt(String(task.details.numberOfPacks), 10) || 1;
    return {
      costType: "partnerReview",
      currency: "SGD",
      partnerConfirms: false,
      label: "Free / partner assessment",
      breakdown: [{ label: "Food pack / rations", quantity: packs, costType: "partnerReview" }],
    };
  }

  const lines: CostBreakdownLine[] = [];
  let fixedTotal = 0;
  let estMin = 0;
  let estMax = 0;
  let hasFixed = false;
  let hasFree = false;
  let hasEstimated = false;
  let hasPartnerReview = false;
  let partnerConfirms = false;

  const add = (label: string, quantity: number, offering: Offering | undefined) => {
    if (!offering) {
      lines.push({ label, quantity, costType: "partnerReview" });
      hasPartnerReview = true;
      return;
    }
    if (offering.partnerConfirms) partnerConfirms = true;
    if (offering.costType === "free") {
      lines.push({ label, quantity, unitPrice: 0, subtotal: 0, costType: "free" });
      hasFree = true;
    } else if (offering.costType === "estimated") {
      const lo = (offering.min ?? 0) * quantity;
      const hi = (offering.max ?? 0) * quantity;
      estMin += lo;
      estMax += hi;
      hasEstimated = true;
      lines.push({ label, quantity, min: lo, max: hi, costType: "estimated" });
    } else {
      // fixed | subsidised
      const unitPrice = offering.price ?? 0;
      const subtotal = unitPrice * quantity;
      fixedTotal += subtotal;
      hasFixed = true;
      lines.push({ label, quantity, unitPrice, subtotal, costType: offering.costType });
    }
  };

  switch (task.supportType) {
    case "supplies": {
      const map = partner.offerings.supplies;
      const items = Array.isArray(task.details.itemsNeeded)
        ? (task.details.itemsNeeded as ItemQuantity[])
        : [];
      for (const it of items) {
        const qty = Number(it.quantity) || 1;
        if (it.partnerReviewNeeded) {
          lines.push({ label: it.customItem || it.item, quantity: qty, costType: "partnerReview" });
          hasPartnerReview = true;
          continue;
        }
        add(it.item, qty, map?.[SUPPLY_KEY[it.item]]);
      }
      break;
    }
    case "food": {
      const map = partner.offerings.food;
      const subtype = task.selectedSubtypes[0] || "Food support";
      if (subtype === "Cooked meals") {
        if (task.details.duration === "Need longer-term meal support") {
          lines.push({ label: "Cooked meals (longer-term)", quantity: 1, costType: "partnerReview" });
          hasPartnerReview = true;
          break;
        }
        const portions = parseInt(String(task.details.portionsPerMeal), 10) || 1;
        const mealsPerDay = Array.isArray(task.details.mealsNeeded)
          ? task.details.mealsNeeded.length || 1
          : 1;
        add("Cooked meals", portions * mealsPerDay, map?.cookedMeal);
        break;
      }
      const key = FOOD_KEY[subtype];
      add(subtype, 1, key ? map?.[key] : undefined);
      break;
    }
    case "transport": {
      const map = partner.offerings.transport;
      const wheelchair =
        task.details.wheelchairRequired === true ||
        task.selectedSubtypes.includes("Wheelchair-friendly transport");
      add(
        wheelchair ? "Wheelchair clinic trip" : "Clinic trip",
        1,
        map?.[wheelchair ? "wheelchairTrip" : "clinicTrip"],
      );
      if (task.details.returnTripNeeded === true || task.selectedSubtypes.includes("Return trip")) {
        add("Return trip", 1, map?.returnTripAddon);
      }
      break;
    }
    case "welfare": {
      const map = partner.offerings.welfareCheck;
      const homeVisit =
        task.details.checkMethod === "Home visit" || task.selectedSubtypes.includes("Home visit");
      add(homeVisit ? "Home visit" : "Phone check-in", 1, map?.[homeVisit ? "homeVisit" : "phoneCheckIn"]);
      break;
    }
    case "referral": {
      add("Navigation call", 1, partner.offerings.careReferral?.navigationCall);
      break;
    }
  }

  let costType: CostEstimate["costType"];
  if (hasEstimated) costType = "estimated";
  else if (hasPartnerReview && !hasFixed && !hasFree) costType = "partnerReview";
  else if (hasFixed && hasFree) costType = "mixed";
  else if (hasFixed) costType = "fixed";
  else costType = "free";

  const est: CostEstimate = { costType, currency: "SGD", partnerConfirms, breakdown: lines };
  if (hasEstimated) {
    est.min = fixedTotal + estMin;
    est.max = fixedTotal + estMax;
  } else if (costType === "free") {
    est.total = 0;
  } else if (costType !== "partnerReview") {
    est.total = fixedTotal;
  }
  if (costType !== "free" && costType !== "partnerReview") est.paymentHandledBy = "partner";
  return est;
}

/** Just the money part, e.g. "$8" or "$12–$20" (no trailing words). */
export function costAmount(est: CostEstimate): string {
  if (est.min != null && est.max != null) {
    return est.min === est.max ? `$${est.min}` : `$${est.min}–$${est.max}`;
  }
  if (est.total != null) return `$${est.total}`;
  return "—";
}

/** Short chip label, e.g. "Free", "$8 estimated", "$12–$20 estimated", "Partner review". */
export function formatCostEstimate(est: CostEstimate): string {
  if (est.costType === "free") return "Free";
  if (est.costType === "partnerReview") return "Partner review";
  return `${costAmount(est)} estimated`;
}

/** One-line explanation shown beside a paid estimate. */
export function costDetail(est: CostEstimate): string {
  if (est.costType === "free") return "";
  if (est.costType === "partnerReview")
    return est.label ? "Partner will confirm eligibility." : "Partner will advise after assessment.";
  if (est.partnerConfirms) return "Partner confirms final cost";
  return "Partner will contact you to confirm payment.";
}
