// ---------------------------------------------------------------------------
// Cost estimation for the community help flow (mock, transparency only).
// No payment logic — community/social-service partners arrange any payment or
// subsidy directly. Supplies are community/public stock (free, subject to
// availability), never retail-priced.
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
  Masks: "masks",
  "ART kits": "artKits",
  "Hand sanitiser": "handSanitiser",
  "Dengue kit / repellent pack": "dengueKit",
};

/** The offering a partner has for a given supplies item label, if any. */
export function getOfferingForTaskItem(itemLabel: string, partner: Organisation): Offering | undefined {
  return partner.offerings.supplies?.[SUPPLY_KEY[itemLabel]];
}

/** Compute a structured cost estimate for a task fulfilled by a partner. */
export function calculateTaskCost(task: CostTask, partner: Organisation): CostEstimate {
  // --- Supplies: community/public stock — free, subject to availability ----
  if (task.supportType === "supplies") {
    const items = Array.isArray(task.details.itemsNeeded)
      ? (task.details.itemsNeeded as ItemQuantity[])
      : [];
    const breakdown: CostBreakdownLine[] = items.map((it) => ({
      label: it.item,
      quantity: Number(it.quantity) || 1,
      unitPrice: 0,
      subtotal: 0,
      costType: "free",
    }));
    return {
      costType: "free",
      total: 0,
      currency: "SGD",
      partnerConfirms: false,
      label: "Free / subject to stock",
      detail: "Partner will confirm availability.",
      breakdown,
    };
  }

  // --- Food: cooked meals (Meals-on-Wheels) vs food packs (food-aid) -------
  if (task.supportType === "food") {
    const subtype = task.selectedSubtypes[0] || "Food support";

    if (subtype === "Cooked meals") {
      if (!partner.supportSubtypes.includes("Cooked meals")) {
        return partnerReview("Cooked meals", "Partner will advise after assessment.");
      }
      const portions = parseInt(String(task.details.portionsPerMeal), 10) || 1;
      const mealsPerDay = Array.isArray(task.details.mealsNeeded)
        ? task.details.mealsNeeded.length || 1
        : 1;
      return {
        costType: "estimated",
        min: 4.9,
        max: 7,
        currency: "SGD",
        partnerConfirms: true,
        label: "$4.90–$7.00 per meal estimated",
        detail: "Partner confirms cost. Subsidies may apply.",
        breakdown: [
          {
            label: "Cooked meal",
            quantity: portions * mealsPerDay,
            min: 4.9,
            max: 7,
            costType: "estimated",
          },
        ],
      };
    }

    if (subtype === "Food pack / rations") {
      if (!partner.supportSubtypes.includes("Food pack / rations")) {
        return partnerReview("Food pack / rations", "Partner will advise after assessment.");
      }
      const packs =
        task.details.numberOfPacks === "Other"
          ? Number(task.details.numberOfPacksOther) || 1
          : parseInt(String(task.details.numberOfPacks), 10) || 1;
      return {
        costType: "partnerReview",
        currency: "SGD",
        partnerConfirms: false,
        label: "Free / partner assessment",
        detail: "Partner will confirm eligibility.",
        breakdown: [{ label: "Food pack / rations", quantity: packs, costType: "partnerReview" }],
      };
    }
  }

  // --- Assisted transport: estimated round-trip, partner confirms ----------
  if (task.supportType === "transport") {
    const offering = partner.offerings.transport?.assistedTrip;
    const min = offering?.min ?? 40;
    const max = offering?.max ?? 90;
    return {
      costType: "estimated",
      min,
      max,
      currency: "SGD",
      partnerConfirms: true,
      label: `$${min}–$${max} estimated`,
      detail: "Partner confirms final cost. Subsidies may apply.",
      paymentHandledBy: "partner",
      breakdown: [{ label: "Assisted appointment transport", quantity: 1, min, max, costType: "estimated" }],
    };
  }

  // --- Welfare check & care referral: free ---------------------------------
  return {
    costType: "free",
    total: 0,
    currency: "SGD",
    partnerConfirms: false,
    breakdown: [
      {
        label: task.supportType === "welfare" ? "Welfare check" : "Care navigation",
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
        costType: "free",
      },
    ],
  };
}

/** A partner-assessed estimate with no priceable line. */
function partnerReview(label: string, detail: string): CostEstimate {
  return {
    costType: "partnerReview",
    currency: "SGD",
    partnerConfirms: false,
    detail,
    breakdown: [{ label, quantity: 1, costType: "partnerReview" }],
  };
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
  if (est.label) return est.label;
  if (est.costType === "free") return "Free";
  if (est.costType === "partnerReview") return "Partner assessment";
  return `${costAmount(est)} estimated`;
}

/** One-line explanation shown beside an estimate. */
export function costDetail(est: CostEstimate): string {
  if (est.detail) return est.detail;
  if (est.costType === "free") return "";
  if (est.costType === "partnerReview") return "Partner will advise after assessment.";
  if (est.partnerConfirms) return "Partner confirms final cost.";
  return "Partner will contact you to confirm payment.";
}
