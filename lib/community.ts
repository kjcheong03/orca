// ---------------------------------------------------------------------------
// Community help — partner dataset + support templates (Phase 1, data only).
//
// Caregivers request non-emergency support for a vulnerable elderly care
// recipient. Later phases build the request flow and partner dashboards on top
// of this module; for now this is the mock data + types + lookup helpers.
//
// Everything here is frontend mock data — easy to edit and extend.
// ---------------------------------------------------------------------------

// --- shared request contract (single source of truth in ./contract) --------
// These types/values are defined once in lib/contract.ts and re-exported here
// so existing imports from "@/lib/community" keep working unchanged.

import {
  supportTypeLabels,
  type SupportTypeId,
  type RequestStatus,
  type SupplyAvailabilityMode,
  type FulfilmentRoute,
  type CostType,
  type CostBreakdownLine,
  type CostEstimate,
  type RequestTaskSession,
  type RequestSession,
} from "./contract";

export {
  supportTypeLabels,
  type SupportTypeId,
  type RequestStatus,
  type SupplyAvailabilityMode,
  type FulfilmentRoute,
  type CostType,
  type CostBreakdownLine,
  type CostEstimate,
  type RequestTaskSession,
  type RequestSession,
};

// --- form field templates --------------------------------------------------

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "stepper"
  | "select"
  | "multiselect"
  | "multiselectDropdown"
  | "radio"
  | "toggle"
  | "datetime"
  | "date"
  | "note"
  | "itemQuantities";

/** A selected supply item with its quantity (and a name for "Other item"). */
export interface ItemQuantity {
  item: string;
  quantity: string | number;
  customItem?: string;
  /** True for the free-text "Other item" — availability confirmed by partner. */
  partnerReviewNeeded?: boolean;
}

export interface FormField {
  /** Stable key used as the form value / payload key. */
  key: string;
  label: string;
  kind: FieldKind;
  /** Choices for select / multiselect / radio. */
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /** Bounds for the stepper kind. */
  min?: number;
  max?: number;
  /** Optional helper/hint text shown under the field. */
  help?: string;
  /** Only render this field when another field equals a given value. */
  showWhen?: { field: string; equals: string };
  /** Only render this field when a given Step 1 subtype is selected. */
  showWhenSubtype?: string;
}

export interface SupportTemplate {
  id: SupportTypeId;
  label: string;
  /** Specific need within the support type. */
  subtypes: string[];
  /** Ordered field definitions a later phase renders into a form. */
  fields: FormField[];
}

// Shared option sets — keep these in one place so they're easy to tweak.
export const AREAS = ["Ang Mo Kio", "Bishan", "Toa Payoh", "Other"] as const;
// Physical collection / pickup points — no "Other" (there is no "Other" distribution point).
export const COLLECTION_AREAS = ["Ang Mo Kio", "Bishan", "Toa Payoh"] as const;
export const URGENCY = ["Today", "Within 2–3 days", "This week", "Not urgent"] as const;
export const CONTACT_METHODS = ["Phone call", "WhatsApp", "SMS", "Email"] as const;
export const LANGUAGES = [
  "English",
  "Mandarin",
  "Malay",
  "Tamil",
  "Tagalog",
  "Indonesian",
] as const;
// Community / public distribution stock only — not retail items.
export const SUPPLY_ITEMS = [
  "Masks",
  "ART kits",
  "Hand sanitiser",
  "Dengue kit / repellent pack",
] as const;

const notesField: FormField = {
  key: "notes",
  label: "Anything else we should know?",
  kind: "textarea",
  placeholder: "Optional notes for the partner",
};
// Care referral asks about contact timing rather than urgency.
const contactTimingField: FormField = {
  key: "urgency",
  label: "When would you like to be contacted?",
  kind: "radio",
  options: [...URGENCY],
  required: true,
};

export const supportTemplates: SupportTemplate[] = [
  {
    id: "supplies",
    label: supportTypeLabels.supplies,
    subtypes: [...SUPPLY_ITEMS],
    fields: [
      {
        key: "itemsNeeded",
        label: "Selected items",
        kind: "itemQuantities",
        required: true,
      },
      {
        key: "neededBy",
        label: "Needed by",
        kind: "radio",
        options: ["Today", "Within 2–3 days", "This week"],
        required: true,
      },
      {
        key: "suppliesFulfilment",
        label: "Fulfilment method",
        kind: "select",
        options: ["Collect from distribution point", "Delivery if available", "Either is okay"],
        required: true,
      },
      // Delivery (or either) — address comes from Personal details.
      { key: "preferredDeliveryTime", label: "Preferred delivery time (optional)", kind: "text", placeholder: "e.g. before 12pm", showWhen: { field: "suppliesFulfilment", equals: "Delivery if available" } },
      // Collection.
      { key: "preferredCollectionArea", label: "Preferred collection area", kind: "select", options: [...COLLECTION_AREAS], required: true, showWhen: { field: "suppliesFulfilment", equals: "Collect from distribution point" } },
      { key: "preferredCollectionTime", label: "Preferred collection time (optional)", kind: "text", placeholder: "e.g. this afternoon", showWhen: { field: "suppliesFulfilment", equals: "Collect from distribution point" } },
      // Either is okay — collection area + timing (address is in Personal details).
      { key: "preferredCollectionArea", label: "Preferred collection area", kind: "select", options: [...COLLECTION_AREAS], required: true, showWhen: { field: "suppliesFulfilment", equals: "Either is okay" } },
      { key: "preferredCollectionTime", label: "Preferred collection / delivery time (optional)", kind: "text", placeholder: "e.g. this afternoon", showWhen: { field: "suppliesFulfilment", equals: "Either is okay" } },
      notesField,
    ],
  },
  {
    id: "food",
    label: supportTypeLabels.food,
    subtypes: ["Cooked meals", "Food pack / rations"],
    fields: [
      // --- Cooked meals specifics ---
      {
        key: "portionsPerMeal",
        label: "Portions per meal",
        kind: "stepper",
        min: 1,
        max: 4,
        required: true,
        showWhenSubtype: "Cooked meals",
      },
      {
        key: "mealsNeeded",
        label: "Meals needed",
        kind: "multiselect",
        options: ["Lunch", "Dinner"],
        required: true,
        showWhenSubtype: "Cooked meals",
      },
      {
        key: "startDate",
        label: "Start date",
        kind: "select",
        options: ["Today", "Tomorrow", "Choose date"],
        required: true,
        showWhenSubtype: "Cooked meals",
      },
      {
        key: "startDateValue",
        label: "Choose start date",
        kind: "date",
        required: true,
        showWhen: { field: "startDate", equals: "Choose date" },
        showWhenSubtype: "Cooked meals",
      },
      {
        key: "duration",
        label: "Duration",
        kind: "select",
        options: ["Today only", "2–3 days", "This week", "Need longer-term meal support"],
        required: true,
        showWhenSubtype: "Cooked meals",
      },
      // --- Dietary (cooked meals) ---
      {
        key: "dietaryRestrictions",
        label: "Dietary restrictions",
        kind: "multiselectDropdown",
        placeholder: "Select restrictions",
        options: ["Halal", "Vegetarian", "Soft food", "Low sugar", "Low salt", "Other"],
        showWhenSubtype: "Cooked meals",
      },
      {
        key: "dietaryRestrictionsOther",
        label: "Please specify",
        kind: "text",
        placeholder: "e.g. no shellfish, diabetic-friendly",
        required: true,
        showWhen: { field: "dietaryRestrictions", equals: "Other" },
        showWhenSubtype: "Cooked meals",
      },
      // --- Delivery (cooked meals are delivery-only) ---
      { key: "preferredDeliveryTime", label: "Preferred delivery time/window", kind: "text", placeholder: "e.g. before 12pm", showWhenSubtype: "Cooked meals" },

      // --- Food pack / rations specifics ---
      {
        key: "packType",
        label: "Type of pack",
        kind: "select",
        options: ["Standard food pack / rations", "Food pack with fresh add-ons, if available"],
        required: true,
        showWhenSubtype: "Food pack / rations",
      },
      {
        key: "numberOfPacks",
        label: "Number of packs",
        kind: "radio",
        options: ["1 pack", "2 packs", "Other"],
        required: true,
        showWhenSubtype: "Food pack / rations",
      },
      {
        key: "numberOfPacksOther",
        label: "How many packs?",
        kind: "number",
        placeholder: "e.g. 3",
        required: true,
        showWhen: { field: "numberOfPacks", equals: "Other" },
        showWhenSubtype: "Food pack / rations",
      },
      {
        key: "neededBy",
        label: "When needed",
        kind: "radio",
        options: ["Today", "2–3 days", "This week"],
        required: true,
        showWhenSubtype: "Food pack / rations",
      },
      {
        key: "fulfilmentMethod",
        label: "Fulfilment method",
        kind: "select",
        options: ["Doorstep delivery", "Collect from distribution point", "Either is okay"],
        required: true,
        showWhenSubtype: "Food pack / rations",
      },
      // Doorstep delivery — address comes from Personal details.
      { key: "preferredDeliveryWindow", label: "Preferred delivery window", kind: "text", placeholder: "e.g. weekday mornings", showWhen: { field: "fulfilmentMethod", equals: "Doorstep delivery" }, showWhenSubtype: "Food pack / rations" },
      // Collect from distribution point
      { key: "pickupArea", label: "Preferred pickup area", kind: "select", options: [...COLLECTION_AREAS], required: true, showWhen: { field: "fulfilmentMethod", equals: "Collect from distribution point" }, showWhenSubtype: "Food pack / rations" },
      { key: "pickupTime", label: "Preferred pickup time (optional)", kind: "text", placeholder: "e.g. this afternoon", showWhen: { field: "fulfilmentMethod", equals: "Collect from distribution point" }, showWhenSubtype: "Food pack / rations" },
      // Either is okay — preferred area only (address is in Personal details).
      { key: "generalPreferredArea", label: "Preferred area", kind: "select", options: [...COLLECTION_AREAS], required: true, showWhen: { field: "fulfilmentMethod", equals: "Either is okay" }, showWhenSubtype: "Food pack / rations" },
      { key: "timingConstraints", label: "Any timing constraints (optional)", kind: "text", placeholder: "e.g. before the weekend", showWhen: { field: "fulfilmentMethod", equals: "Either is okay" }, showWhenSubtype: "Food pack / rations" },
      // Restrictions
      {
        key: "foodRestrictions",
        label: "Food restrictions",
        kind: "multiselectDropdown",
        placeholder: "Select restrictions",
        options: ["Halal", "Vegetarian", "Low sugar", "Low salt", "Allergies / avoid certain items"],
        help: "Partner may confirm what can be accommodated.",
        showWhenSubtype: "Food pack / rations",
      },
      {
        key: "restrictionNotes",
        label: "Allergies / items to avoid",
        kind: "text",
        placeholder: "e.g. no shellfish, no peanuts",
        required: true,
        showWhen: { field: "foodRestrictions", equals: "Allergies / avoid certain items" },
        showWhenSubtype: "Food pack / rations",
      },
      notesField,
    ],
  },
  {
    id: "welfare",
    label: supportTypeLabels.welfare,
    subtypes: [
      "Caregiver cannot check in",
      "Follow-up after symptoms",
      "General wellbeing check",
      "Concern about daily needs",
      "Other",
    ],
    fields: [
      {
        key: "specifyOther",
        label: "Please specify what help is needed",
        kind: "textarea",
        placeholder: "Tell us what kind of check or help is needed",
        required: true,
        showWhenSubtype: "Other",
      },
      {
        key: "checkMethod",
        label: "Check method",
        kind: "radio",
        options: ["Phone call", "Home visit", "Either is okay"],
        required: true,
      },
      {
        key: "checkInDay",
        label: "When should they check in?",
        kind: "radio",
        options: ["Today", "Tomorrow", "Choose date"],
        required: true,
      },
      {
        key: "checkInDayValue",
        label: "Choose date",
        kind: "date",
        required: true,
        showWhen: { field: "checkInDay", equals: "Choose date" },
      },
      {
        key: "preferredTime",
        label: "Preferred time",
        kind: "radio",
        options: ["Morning", "Afternoon", "Evening", "Anytime"],
        required: true,
      },
      {
        key: "language",
        label: "Preferred language",
        kind: "select",
        options: [...LANGUAGES],
      },
      {
        key: "safetyNotes",
        label: "Safety notes (optional)",
        kind: "textarea",
        placeholder: "Mobility, who's usually around, etc.",
      },
      notesField,
    ],
  },
  {
    id: "transport",
    label: supportTypeLabels.transport,
    subtypes: ["Medical appointment transport"],
    fields: [
      {
        key: "destination",
        label: "Destination (clinic / hospital)",
        kind: "text",
        placeholder: "e.g. AMK Polyclinic",
        required: true,
      },
      { key: "appointmentDateTime", label: "Appointment date & time", kind: "datetime", required: true },
      // Pickup is the care recipient's home address — collected in Personal details (Step 3).
      { key: "wheelchairRequired", label: "Wheelchair required", kind: "toggle" },
      { key: "escortNeeded", label: "Escort needed", kind: "toggle" },
      { key: "caregiverAccompanying", label: "Caregiver accompanying", kind: "toggle" },
      { key: "returnTripNeeded", label: "Return trip needed", kind: "toggle" },
      {
        key: "mobilityNeeds",
        label: "Mobility notes (optional)",
        kind: "text",
        placeholder: "e.g. uses a walking aid",
      },
      notesField,
    ],
  },
  {
    id: "referral",
    label: supportTypeLabels.referral,
    subtypes: [
      "Find suitable eldercare service",
      "Apply for support / subsidies",
      "Longer-term home care help",
      "Connect to local AAC",
      "Other",
    ],
    fields: [
      {
        key: "specifyOther",
        label: "Please specify your concern / request",
        kind: "textarea",
        placeholder: "Tell us what you need help with",
        required: true,
        showWhenSubtype: "Other",
      },
      {
        key: "mainConcern",
        label: "Main concern",
        kind: "textarea",
        placeholder: "Tell us what's worrying you",
        required: true,
      },
      {
        key: "currentSituation",
        label: "Current situation",
        kind: "textarea",
        placeholder: "What's happening now / what's been tried",
      },
      contactTimingField,
      { key: "language", label: "Preferred language", kind: "select", options: [...LANGUAGES] },
      {
        key: "existingSupport",
        label: "Existing support / context (optional)",
        kind: "text",
        placeholder: "e.g. already with a GP, getting meals",
      },
      notesField,
    ],
  },
];

/** Whether a field should be shown given the current details + selected subtypes. */
export function isFieldVisible(
  field: FormField,
  details: Record<string, unknown>,
  subtypes: string[] = [],
): boolean {
  if (field.showWhen) {
    const v = details[field.showWhen.field];
    const ok = Array.isArray(v) ? v.includes(field.showWhen.equals) : v === field.showWhen.equals;
    if (!ok) return false;
  }
  if (field.showWhenSubtype && !subtypes.includes(field.showWhenSubtype)) return false;
  return true;
}

// --- partner organisations -------------------------------------------------

export type SupportStatus = "active" | "busy" | "unavailable";

/** Per-org capacity: counts (slots), descriptions, or lists (time windows). */
export type Capacity = Record<string, number | string | string[]>;
/** Physical stock counts, where the partner holds inventory. */
export type StockInventory = Record<string, number>;

// --- pricing / offerings (mock; for cost transparency only) ----------------

export type OfferingCostType = "free" | "fixed" | "subsidised" | "estimated";

/** Price info for a single item/service a partner offers. */
export interface Offering {
  costType: OfferingCostType;
  price?: number; // fixed / subsidised
  min?: number; // estimated range
  max?: number;
  partnerConfirms?: boolean; // final cost confirmed by partner
}

/** Item/service-level pricing, grouped by support type. */
export interface Offerings {
  supplies?: Record<string, Offering>;
  food?: Record<string, Offering>;
  transport?: Record<string, Offering>;
  welfareCheck?: Record<string, Offering>;
  careReferral?: Record<string, Offering>;
}

export interface Organisation {
  id: string;
  name: string;
  /** Logo path under /public (e.g. "/logos/allkin.png"); falls back to a letter. */
  logo?: string;
  description: string;
  serviceAreas: string[];
  supportTypes: SupportTypeId[];
  /** Specific subtypes this partner can handle (subset of the templates'). */
  supportSubtypes: string[];
  capabilities: string[];
  limitations: string[];
  status: SupportStatus;
  /** Human-readable availability summary. */
  availability: string;
  capacity: Capacity;
  stockInventory?: StockInventory;
  /** Which dashboard a later phase routes this partner to. */
  dashboardType: "community-hub" | "supplies" | "transport" | "outreach";
  tags: string[];
  /** Item/service-level pricing for cost transparency. */
  offerings: Offerings;
}

// --- cost estimate (computed for a task + chosen partner) ------------------

// --- supply / food fulfilment routes ---------------------------------------
// Supplies are episodic public-health distribution (not standing partners);
// food is split by subtype to the real service that fulfils it.
// (CostEstimate / FulfilmentRoute / SupplyAvailabilityMode now live in ./contract.)

interface SupplyRoute {
  routeName: string;
  logo?: string;
  routeType: "public_distribution" | "community_distribution";
  availabilityMode: SupplyAvailabilityMode;
  costLabel: string;
  status: string;
}

const TEMASEK_ROUTE: SupplyRoute = {
  routeName: "Temasek Foundation distribution exercise",
  logo: "/logos/temasek.png",
  routeType: "public_distribution",
  availabilityMode: "active_distribution_exercise",
  costLabel: "Free",
  status: "Available while stock lasts",
};

/**
 * Maps each community supply item to its real-world public/community
 * distribution route. These are episodic health-emergency exercises, not
 * standing partners — names are illustrative of the real channels involved.
 */
export const SUPPLY_ROUTES: Record<string, SupplyRoute> = {
  Masks: TEMASEK_ROUTE,
  "Hand sanitiser": TEMASEK_ROUTE,
  "ART kits": {
    routeName: "Ministry of Health — ART kit distribution",
    logo: "/logos/moh.png",
    routeType: "public_distribution",
    availabilityMode: "active_distribution_exercise",
    costLabel: "Free",
    status: "Eligible collection",
  },
  "Dengue kit / repellent pack": {
    routeName: "NEA dengue outreach / local community stock",
    logo: "/logos/nea.png",
    routeType: "community_distribution",
    availabilityMode: "local_stock_subject_to_availability",
    costLabel: "Free / subject to stock",
    status: "Partner will confirm availability",
  },
};

/** Food subtype → the real partner service that fulfils it. */
export const FOOD_ROUTES: Record<string, string> = {
  "Cooked meals": "touch-meals-on-wheels",
  "Food pack / rations": "food-from-the-heart",
};

export const organisations: Organisation[] = [
  {
    id: "allkin-aac-amk",
    name: "Allkin Singapore — Active Ageing / Senior Outreach",
    logo: "/logos/allkin.png",
    description:
      "Social service agency running senior outreach and Active Ageing services in Ang Mo Kio (also operates the SG Cares Volunteer Centre there).",
    serviceAreas: ["Ang Mo Kio"],
    supportTypes: ["welfare", "referral"],
    supportSubtypes: [
      "Caregiver cannot check in",
      "Follow-up after symptoms",
      "General wellbeing check",
      "Concern about daily needs",
      "Other",
      "Home visit",
      "Find suitable eldercare service",
      "Apply for support / subsidies",
      "Longer-term home care help",
      "Connect to local AAC",
    ],
    capabilities: [
      "Volunteer phone and home welfare check-ins",
      "Senior outreach and befriending",
      "Care referral and navigation help",
    ],
    limitations: [
      "No paid retail supply fulfilment",
      "No medical transport",
      "No cooked meal delivery",
    ],
    status: "active",
    availability: "Daytime · volunteer-run",
    capacity: {
      "welfare check slots today": 6,
      "navigation callback slots today": 4,
    },
    dashboardType: "outreach",
    tags: ["nearby", "senior outreach"],
    offerings: {
      welfareCheck: {
        phoneCheckIn: { costType: "free", price: 0 },
        homeVisit: { costType: "free", price: 0 },
      },
      careReferral: {
        navigationCall: { costType: "free", price: 0 },
      },
    },
  },
  {
    id: "care-corner-aac-toa-payoh",
    name: "Care Corner Active Ageing Centre — Toa Payoh",
    logo: "/logos/care-corner.png",
    description:
      "Neighbourhood Active Ageing Centre supporting seniors in Toa Payoh with outreach, welfare, and care navigation.",
    serviceAreas: ["Toa Payoh"],
    supportTypes: ["welfare", "referral"],
    supportSubtypes: [
      "Caregiver cannot check in",
      "Follow-up after symptoms",
      "General wellbeing check",
      "Concern about daily needs",
      "Other",
      "Home visit",
      "Find suitable eldercare service",
      "Apply for support / subsidies",
      "Longer-term home care help",
      "Connect to local AAC",
    ],
    capabilities: [
      "Welfare check-ins for seniors",
      "Local senior outreach",
      "Care referral and navigation help",
    ],
    limitations: [
      "No paid retail supply fulfilment",
      "No medical transport",
      "No cooked meal delivery",
    ],
    status: "active",
    availability: "Daytime · neighbourhood-based",
    capacity: {
      "welfare check slots today": 5,
      "navigation callback slots today": 3,
    },
    dashboardType: "outreach",
    tags: ["nearby", "senior outreach"],
    offerings: {
      welfareCheck: {
        phoneCheckIn: { costType: "free", price: 0 },
        homeVisit: { costType: "free", price: 0 },
      },
      careReferral: {
        navigationCall: { costType: "free", price: 0 },
      },
    },
  },
  {
    id: "st-lukes-aac-bishan",
    name: "St Luke's ElderCare Active Ageing Centre — Bishan",
    logo: "/logos/st-lukes.png",
    description:
      "Active Ageing Centre supporting seniors in Bishan with outreach, welfare check-ins, and care navigation.",
    serviceAreas: ["Bishan"],
    supportTypes: ["welfare", "referral"],
    supportSubtypes: [
      "Caregiver cannot check in",
      "Follow-up after symptoms",
      "General wellbeing check",
      "Concern about daily needs",
      "Other",
      "Home visit",
      "Find suitable eldercare service",
      "Apply for support / subsidies",
      "Longer-term home care help",
      "Connect to local AAC",
    ],
    capabilities: [
      "Welfare check-ins for seniors",
      "Local senior outreach",
      "Care referral and navigation help",
    ],
    limitations: [
      "No paid retail supply fulfilment",
      "No medical transport",
      "No cooked meal delivery",
    ],
    status: "active",
    availability: "Daytime · neighbourhood-based",
    capacity: {
      "welfare check slots today": 5,
      "navigation callback slots today": 3,
    },
    dashboardType: "outreach",
    tags: ["nearby", "senior outreach"],
    offerings: {
      welfareCheck: {
        phoneCheckIn: { costType: "free", price: 0 },
        homeVisit: { costType: "free", price: 0 },
      },
      careReferral: {
        navigationCall: { costType: "free", price: 0 },
      },
    },
  },
  {
    id: "aic-link",
    name: "AIC Link",
    logo: "/logos/aic.png",
    description:
      "Agency for Integrated Care's referral and navigation channel — helps caregivers find eldercare services, apply for support, and connect to local services.",
    serviceAreas: ["Ang Mo Kio", "Bishan", "Toa Payoh"],
    supportTypes: ["referral"],
    supportSubtypes: [
      "Find suitable eldercare service",
      "Apply for support / subsidies",
      "Longer-term home care help",
      "Connect to local AAC",
      "Other",
    ],
    capabilities: [
      "Advise on eldercare services and schemes",
      "Help apply for support / subsidies",
      "Connect to local Active Ageing Centres",
    ],
    limitations: [
      "No immediate delivery of physical items",
      "No emergency response",
      "No medical treatment",
    ],
    status: "active",
    availability: "Daytime · hotline + service touchpoints · multilingual",
    capacity: {
      "navigation callback slots today": 8,
      "languages supported": ["English", "Mandarin", "Malay", "Tamil"],
    },
    dashboardType: "outreach",
    tags: ["care navigation"],
    offerings: {
      careReferral: {
        navigationCall: { costType: "free", price: 0 },
      },
    },
  },
  {
    id: "touch-meals-on-wheels",
    name: "TOUCH Meals-on-Wheels",
    logo: "/logos/touch.png",
    description:
      "Cooked meal delivery for homebound seniors who cannot buy or prepare meals. Charges advised after assessment; subsidies may apply.",
    serviceAreas: ["Ang Mo Kio", "Bishan", "Toa Payoh"],
    supportTypes: ["food"],
    supportSubtypes: ["Cooked meals"],
    capabilities: [
      "Cooked meal delivery — lunch, dinner, or both",
      "Dietary options (halal, vegetarian, soft food) subject to provider",
    ],
    limitations: [
      "No food packs / rations",
      "No custom groceries",
      "No welfare checks",
    ],
    status: "active",
    availability: "Daily delivery · means-tested subsidies",
    capacity: {
      "meal slots today": 20,
    },
    dashboardType: "community-hub",
    tags: ["cooked meals", "subsidies may apply"],
    offerings: {
      food: {
        cookedMeal: { costType: "estimated", min: 4.9, max: 7, partnerConfirms: true },
      },
    },
  },
  {
    id: "food-from-the-heart",
    name: "Food from the Heart — Community Food Pack",
    logo: "/logos/food-from-the-heart.png",
    description:
      "Food-aid partner providing monthly food packs / rations (non-perishables plus fresh add-ons) for vulnerable seniors, subject to partner assessment.",
    serviceAreas: ["Ang Mo Kio", "Bishan", "Toa Payoh"],
    supportTypes: ["food"],
    supportSubtypes: ["Food pack / rations"],
    capabilities: [
      "Monthly food packs / rations",
      "Food pack with fresh add-ons, if available",
    ],
    limitations: [
      "No custom grocery shopping",
      "No supermarket vouchers in this flow",
      "No cooked meals",
      "Monthly cycle — not same-day delivery",
    ],
    status: "active",
    availability: "Monthly distribution · by partner assessment",
    capacity: {
      "food pack slots today": 15,
    },
    dashboardType: "community-hub",
    tags: ["food aid", "partner assessment"],
    offerings: {
      food: {
        foodPack: { costType: "free", price: 0 },
      },
    },
  },
  {
    id: "touch-medical-escort-transport",
    name: "TOUCH Medical Escort & Transport",
    logo: "/logos/touch.png",
    description:
      "Assisted medical appointment transport with trained escort for frail or wheelchair-using seniors. Charges advised after assessment; subsidies may apply.",
    serviceAreas: ["Ang Mo Kio", "Bishan", "Toa Payoh"],
    supportTypes: ["transport"],
    supportSubtypes: ["Medical appointment transport", "Wheelchair-accessible transport"],
    capabilities: [
      "Assisted medical appointment transport",
      "Wheelchair-accessible transport, if available",
      "Escort support",
      "Return trip coordination",
    ],
    limitations: [
      "No emergency transport",
      "No normal taxi / ride-hailing trips",
      "No non-medical errands",
      "Referral / assessment required",
    ],
    status: "active",
    availability: "Pre-booked slots · partner confirmation required",
    capacity: {
      "transport slots today": 4,
      "wheelchair-capable slots today": 2,
      "available time windows": ["10:00 AM", "1:30 PM", "4:00 PM"],
    },
    dashboardType: "transport",
    tags: ["assisted transport", "wheelchair-capable"],
    offerings: {
      transport: {
        assistedTrip: { costType: "estimated", min: 40, max: 90, partnerConfirms: true },
      },
    },
  },
];

// --- request draft (built by the caregiver flow) ---------------------------

/** One chosen support category + its specific needs and filled-in details. */
export interface TaskDraft {
  id: string;
  supportType: SupportTypeId;
  selectedSubtypes: string[];
  details: Record<string, unknown>;
}

/** The clean draft future phases (matching, review) will consume. */
export interface RequestDraft {
  careRecipientName: string;
  linkedTopic: string;
  selectedTasks: TaskDraft[];
}

/** Working state the form holds while editing (keyed by support type). */
export interface TaskState {
  subtypes: string[];
  details: Record<string, unknown>;
}
export type DraftTasks = Partial<Record<SupportTypeId, TaskState>>;

// --- helpers ---------------------------------------------------------------

/** The support template (subtypes + field definitions) for a support type. */
export function getSupportTemplate(type: SupportTypeId): SupportTemplate | undefined {
  return supportTemplates.find((t) => t.id === type);
}

/** Look up a partner organisation by id. */
export function getOrganisation(id: string): Organisation | undefined {
  return organisations.find((o) => o.id === id);
}

// --- final submitted request -----------------------------------------------
// RequestStatus / RequestTaskSession / RequestSession now live in ./contract
// (re-exported at the top of this file).

/** Mock caregiver identity shared with partners (frontend prototype). */
export const caregiver = {
  name: "Chloe",
  contactNumber: "+65 8123 4567",
};

/**
 * Placeholder sink for a submitted request. Phase 4 will persist this into the
 * active/past request log; for now it just surfaces the payload for review.
 */
export function saveRequestSession(session: RequestSession): void {
  // eslint-disable-next-line no-console
  console.log("CARA request session →", session);
}

/**
 * Eligible partner organisations for a support type, optionally narrowed to a
 * specific subtype. Excludes unavailable partners.
 */
export function getEligibleOrganisations(
  type: SupportTypeId,
  subtype?: string,
): Organisation[] {
  return organisations.filter(
    (org) =>
      org.status !== "unavailable" &&
      org.supportTypes.includes(type) &&
      (!subtype || org.supportSubtypes.includes(subtype)),
  );
}
