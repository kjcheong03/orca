// ---------------------------------------------------------------------------
// Community help — partner dataset + support templates (Phase 1, data only).
//
// Caregivers request non-emergency support for a vulnerable elderly care
// recipient. Later phases build the request flow and partner dashboards on top
// of this module; for now this is the mock data + types + lookup helpers.
//
// Everything here is frontend mock data — easy to edit and extend.
// ---------------------------------------------------------------------------

// --- support types ---------------------------------------------------------

export type SupportTypeId =
  | "supplies"
  | "food"
  | "welfare"
  | "transport"
  | "referral";

export const supportTypeLabels: Record<SupportTypeId, string> = {
  supplies: "Supplies / essentials",
  food: "Food / meal support",
  welfare: "Welfare check",
  transport: "Clinic transport help",
  referral: "Care referral / navigation",
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
export const SUPPLY_ITEMS = [
  "Repellent",
  "Masks",
  "ART kits",
  "Thermometer",
  "Hand sanitiser",
  "Soap",
  "Cleaning wipes",
] as const;

const notesField: FormField = {
  key: "notes",
  label: "Anything else we should know?",
  kind: "textarea",
  placeholder: "Optional notes for the partner",
};
const urgencyField: FormField = {
  key: "urgency",
  label: "Urgency",
  kind: "radio",
  options: [...URGENCY],
  required: true,
};
// Care referral asks about contact timing rather than urgency.
const contactTimingField: FormField = {
  key: "urgency",
  label: "When would you like to be contacted?",
  kind: "radio",
  options: [...URGENCY],
  required: true,
};

// Delivery vs pickup — exact address only when someone is delivering/visiting.
const deliveryOrPickupField: FormField = {
  key: "deliveryOrPickup",
  label: "Delivery/pickup",
  kind: "radio",
  options: ["Delivery", "Self-pickup"],
  required: true,
};
const whenDelivery = { field: "deliveryOrPickup", equals: "Delivery" };
const whenPickup = { field: "deliveryOrPickup", equals: "Self-pickup" };
const deliveryFields: FormField[] = [
  { key: "deliveryAddress", label: "Delivery address", kind: "text", placeholder: "Block & street", required: true, showWhen: whenDelivery },
  { key: "unitNumber", label: "Unit number (optional)", kind: "text", placeholder: "#08-45", showWhen: whenDelivery },
  { key: "postalCode", label: "Postal code", kind: "text", placeholder: "560123", required: true, showWhen: whenDelivery },
  { key: "preferredDeliveryTime", label: "Preferred delivery time", kind: "text", placeholder: "e.g. before 12pm", showWhen: whenDelivery },
  { key: "accessNotes", label: "Access notes (optional)", kind: "text", placeholder: "Gate code, lift access, etc.", showWhen: whenDelivery },
];
const pickupFields: FormField[] = [
  { key: "preferredPickupTime", label: "Preferred pickup time (optional)", kind: "text", placeholder: "e.g. this afternoon", showWhen: whenPickup },
];

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
      urgencyField,
      deliveryOrPickupField,
      ...deliveryFields,
      ...pickupFields,
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
        kind: "select",
        options: ["None", "Halal", "Vegetarian", "Soft food", "Low sugar", "Low salt", "Other"],
        required: true,
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
      { key: "deliveryAddress", label: "Delivery address", kind: "text", placeholder: "Block & street", required: true, showWhenSubtype: "Cooked meals" },
      { key: "unitNumber", label: "Unit number (optional)", kind: "text", placeholder: "#08-45", showWhenSubtype: "Cooked meals" },
      { key: "postalCode", label: "Postal code", kind: "text", placeholder: "560123", required: true, showWhenSubtype: "Cooked meals" },
      { key: "preferredDeliveryTime", label: "Preferred delivery time/window", kind: "text", placeholder: "e.g. before 12pm", showWhenSubtype: "Cooked meals" },
      { key: "accessNotes", label: "Access notes (optional)", kind: "text", placeholder: "Gate code, lift access, etc.", showWhenSubtype: "Cooked meals" },

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
      // Doorstep delivery
      { key: "packDeliveryAddress", label: "Delivery address", kind: "text", placeholder: "Block & street", required: true, showWhen: { field: "fulfilmentMethod", equals: "Doorstep delivery" }, showWhenSubtype: "Food pack / rations" },
      { key: "packUnitNumber", label: "Unit number (optional)", kind: "text", placeholder: "#08-45", showWhen: { field: "fulfilmentMethod", equals: "Doorstep delivery" }, showWhenSubtype: "Food pack / rations" },
      { key: "packPostalCode", label: "Postal code", kind: "text", placeholder: "560123", required: true, showWhen: { field: "fulfilmentMethod", equals: "Doorstep delivery" }, showWhenSubtype: "Food pack / rations" },
      { key: "preferredDeliveryWindow", label: "Preferred delivery window", kind: "text", placeholder: "e.g. weekday mornings", showWhen: { field: "fulfilmentMethod", equals: "Doorstep delivery" }, showWhenSubtype: "Food pack / rations" },
      { key: "packAccessNotes", label: "Access notes (optional)", kind: "text", placeholder: "Gate code, lift access, etc.", showWhen: { field: "fulfilmentMethod", equals: "Doorstep delivery" }, showWhenSubtype: "Food pack / rations" },
      // Collect from distribution point
      { key: "pickupArea", label: "Preferred pickup area", kind: "select", options: [...AREAS], required: true, showWhen: { field: "fulfilmentMethod", equals: "Collect from distribution point" }, showWhenSubtype: "Food pack / rations" },
      { key: "pickupTime", label: "Preferred pickup time (optional)", kind: "text", placeholder: "e.g. this afternoon", showWhen: { field: "fulfilmentMethod", equals: "Collect from distribution point" }, showWhenSubtype: "Food pack / rations" },
      // Either is okay — still collect an address in case delivery is arranged
      { key: "generalPreferredArea", label: "Preferred area", kind: "select", options: [...AREAS], required: true, showWhen: { field: "fulfilmentMethod", equals: "Either is okay" }, showWhenSubtype: "Food pack / rations" },
      { key: "packDeliveryAddress", label: "Delivery address", kind: "text", placeholder: "Block & street", required: true, showWhen: { field: "fulfilmentMethod", equals: "Either is okay" }, showWhenSubtype: "Food pack / rations" },
      { key: "packUnitNumber", label: "Unit number (optional)", kind: "text", placeholder: "#08-45", showWhen: { field: "fulfilmentMethod", equals: "Either is okay" }, showWhenSubtype: "Food pack / rations" },
      { key: "packPostalCode", label: "Postal code", kind: "text", placeholder: "560123", required: true, showWhen: { field: "fulfilmentMethod", equals: "Either is okay" }, showWhenSubtype: "Food pack / rations" },
      { key: "packAccessNotes", label: "Access notes (optional)", kind: "text", placeholder: "Gate code, lift access, etc.", showWhen: { field: "fulfilmentMethod", equals: "Either is okay" }, showWhenSubtype: "Food pack / rations" },
      { key: "timingConstraints", label: "Any timing constraints (optional)", kind: "text", placeholder: "e.g. before the weekend", showWhen: { field: "fulfilmentMethod", equals: "Either is okay" }, showWhenSubtype: "Food pack / rations" },
      // Restrictions
      {
        key: "foodRestrictions",
        label: "Food restrictions",
        kind: "multiselectDropdown",
        placeholder: "Select restrictions",
        options: ["None", "Halal", "Vegetarian", "Low sugar", "Low salt", "Allergies / avoid certain items"],
        required: true,
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
        key: "visitAddress",
        label: "Address for visit",
        kind: "text",
        placeholder: "Block & street",
        required: true,
        showWhen: { field: "checkMethod", equals: "Home visit" },
      },
      {
        key: "unitNumber",
        label: "Unit number (optional)",
        kind: "text",
        placeholder: "#08-45",
        showWhen: { field: "checkMethod", equals: "Home visit" },
      },
      {
        key: "postalCode",
        label: "Postal code",
        kind: "text",
        placeholder: "560123",
        required: true,
        showWhen: { field: "checkMethod", equals: "Home visit" },
      },
      {
        key: "accessNotes",
        label: "Access notes (optional)",
        kind: "text",
        placeholder: "Gate code, lift access, etc.",
        showWhen: { field: "checkMethod", equals: "Home visit" },
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
        key: "clinicOrDestination",
        label: "Clinic / destination",
        kind: "text",
        placeholder: "e.g. AMK Polyclinic",
        required: true,
      },
      { key: "appointmentDateTime", label: "Appointment date & time", kind: "datetime", required: true },
      {
        key: "pickupArea",
        label: "Pickup area",
        kind: "select",
        options: [...AREAS],
        required: true,
      },
      { key: "wheelchairRequired", label: "Wheelchair required", kind: "toggle" },
      { key: "escortNeeded", label: "Escort needed", kind: "toggle" },
      { key: "caregiverAccompanying", label: "Caregiver accompanying", kind: "toggle" },
      { key: "returnTripNeeded", label: "Return trip needed", kind: "toggle" },
      {
        key: "mobilityNeeds",
        label: "Mobility needs (optional)",
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

export type CostType = "free" | "fixed" | "mixed" | "estimated" | "partnerReview";

export interface CostBreakdownLine {
  label: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
  min?: number;
  max?: number;
  costType: string;
}

export interface CostEstimate {
  costType: CostType;
  /** Optional display override for the cost chip (e.g. "Free / partner assessment"). */
  label?: string;
  min?: number;
  max?: number;
  total?: number;
  currency: "SGD";
  partnerConfirms: boolean;
  paymentHandledBy?: "partner";
  breakdown: CostBreakdownLine[];
}

export const organisations: Organisation[] = [
  {
    id: "amk-community-care-hub",
    name: "AMK Community Care Hub",
    description: "Local community partner serving Ang Mo Kio households.",
    serviceAreas: ["Ang Mo Kio"],
    supportTypes: ["supplies", "food", "welfare"],
    supportSubtypes: [
      "Repellent",
      "Masks",
      "ART kits",
      "Thermometer",
      "Hand sanitiser",
      "Soap",
      "Cleaning wipes",
      "Cooked meals",
      "Food pack / rations",
      "Home visit",
    ],
    capabilities: [
      "Same-day supply help if stock is available",
      "Basic food/essentials support",
      "Volunteer phone/home check-ins",
    ],
    limitations: ["No clinic transport", "Limited evening availability"],
    status: "active",
    availability: "Daytime · same-day when stock allows · limited evenings",
    capacity: {
      "meal slots today": 12,
      "welfare check slots today": 6,
    },
    stockInventory: {
      repellent: 24,
      masks: 80,
      "ART kits": 30,
      thermometers: 8,
      handSanitiser: 40,
      soap: 60,
      cleaningWipes: 30,
    },
    dashboardType: "community-hub",
    tags: ["nearby", "same-day supplies"],
    offerings: {
      supplies: {
        repellent: { costType: "fixed", price: 3 },
        masks: { costType: "free", price: 0 },
        artKits: { costType: "fixed", price: 2 },
        thermometer: { costType: "fixed", price: 8 },
        handSanitiser: { costType: "fixed", price: 2 },
        soap: { costType: "free", price: 0 },
        cleaningWipes: { costType: "fixed", price: 3 },
      },
      food: {
        cookedMeal: { costType: "subsidised", price: 4 },
        groceries: { costType: "estimated", min: 10, max: 20 },
        shortTermMealSupport: { costType: "subsidised", price: 6 },
      },
      welfareCheck: {
        phoneCheckIn: { costType: "free", price: 0 },
        homeVisit: { costType: "free", price: 0 },
      },
    },
  },
  {
    id: "bishan-toa-payoh-care-hub",
    name: "Bishan-Toa Payoh Care Hub",
    description:
      "Neighbourhood partner serving Bishan and Toa Payoh, with overflow support for nearby areas.",
    serviceAreas: ["Bishan", "Toa Payoh", "Ang Mo Kio overflow"],
    supportTypes: ["supplies", "food", "welfare"],
    supportSubtypes: [
      "Repellent",
      "Masks",
      "ART kits",
      "Thermometer",
      "Hand sanitiser",
      "Soap",
      "Cleaning wipes",
      "Cooked meals",
      "Food pack / rations",
      "Home visit",
    ],
    capabilities: [
      "Backup supplies",
      "Food/essentials delivery",
      "Welfare calls and home visits",
    ],
    limitations: ["Longer response time for Ang Mo Kio"],
    status: "active",
    availability: "Daytime · longer response for Ang Mo Kio overflow",
    capacity: {
      "meal slots today": 8,
      "welfare check slots today": 4,
    },
    stockInventory: {
      repellent: 10,
      masks: 50,
      "ART kits": 12,
      thermometers: 5,
      handSanitiser: 20,
      soap: 30,
      cleaningWipes: 15,
    },
    dashboardType: "community-hub",
    tags: ["overflow-support"],
    offerings: {
      supplies: {
        repellent: { costType: "fixed", price: 4 },
        masks: { costType: "free", price: 0 },
        artKits: { costType: "fixed", price: 3 },
        thermometer: { costType: "fixed", price: 9 },
        handSanitiser: { costType: "fixed", price: 3 },
        soap: { costType: "fixed", price: 1 },
        cleaningWipes: { costType: "fixed", price: 4 },
      },
      food: {
        cookedMeal: { costType: "subsidised", price: 5 },
        groceries: { costType: "estimated", min: 12, max: 22 },
        shortTermMealSupport: { costType: "subsidised", price: 7 },
      },
      welfareCheck: {
        phoneCheckIn: { costType: "free", price: 0 },
        homeVisit: { costType: "free", price: 0 },
      },
    },
  },
  {
    id: "neighbourhood-essentials-partner",
    name: "Neighbourhood Essentials Partner",
    description: "Supplies-focused partner for protective and health-related essentials.",
    serviceAreas: ["Ang Mo Kio", "Bishan", "Toa Payoh"],
    supportTypes: ["supplies"],
    supportSubtypes: [
      "Repellent",
      "Masks",
      "ART kits",
      "Thermometer",
      "Hand sanitiser",
      "Soap",
      "Cleaning wipes",
    ],
    capabilities: [
      "Inventory-based routing",
      "Repellent, masks, ART kits, thermometers, hand sanitiser, soap, wipes",
    ],
    limitations: ["No welfare checks", "No food support"],
    status: "active",
    availability: "Daytime · inventory-based dispatch",
    capacity: {},
    stockInventory: {
      repellent: 60,
      masks: 120,
      "ART kits": 75,
      thermometers: 20,
      handSanitiser: 80,
      soap: 100,
      cleaningWipes: 50,
    },
    dashboardType: "supplies",
    tags: ["same-day supplies", "inventory-based"],
    offerings: {
      supplies: {
        repellent: { costType: "fixed", price: 2 },
        masks: { costType: "free", price: 0 },
        artKits: { costType: "fixed", price: 2 },
        thermometer: { costType: "fixed", price: 7 },
        handSanitiser: { costType: "fixed", price: 2 },
        soap: { costType: "fixed", price: 1 },
        cleaningWipes: { costType: "fixed", price: 3 },
      },
    },
  },
  {
    id: "silverride-volunteers",
    name: "SilverRide Volunteers",
    description: "Elder transport support partner for seniors with mobility needs.",
    serviceAreas: ["Ang Mo Kio", "Bishan", "Toa Payoh"],
    supportTypes: ["transport"],
    supportSubtypes: ["Medical appointment transport"],
    capabilities: [
      "Wheelchair-friendly transport help",
      "Scheduled clinic trips",
      "Return-trip coordination",
      "Caregiver-accompanied trips",
    ],
    limitations: ["Partner must confirm request", "Limited same-day slots"],
    status: "busy",
    availability: "Pre-booked slots · partner confirmation required",
    capacity: {
      "transport slots today": 3,
      "wheelchair-capable slots today": 2,
      "available time windows": ["10:00 AM", "1:30 PM", "4:00 PM"],
    },
    dashboardType: "transport",
    tags: ["wheelchair-capable", "transport"],
    offerings: {
      transport: {
        clinicTrip: { costType: "estimated", min: 12, max: 20, partnerConfirms: true },
        wheelchairTrip: { costType: "estimated", min: 18, max: 30, partnerConfirms: true },
        returnTripAddon: { costType: "fixed", price: 8, partnerConfirms: true },
      },
    },
  },
  {
    id: "carevan-sg",
    name: "CareVan SG",
    description: "General volunteer transport partner for non-wheelchair clinic transport.",
    serviceAreas: ["Ang Mo Kio", "Bishan", "Toa Payoh"],
    supportTypes: ["transport"],
    supportSubtypes: ["Medical appointment transport"],
    capabilities: [
      "Non-wheelchair clinic trips",
      "Short-distance transport",
      "Return trips if available",
    ],
    limitations: ["Not wheelchair-capable", "Not suitable for high-mobility-risk cases"],
    status: "active",
    availability: "Daytime slots · subject to availability",
    capacity: {
      "transport slots today": 5,
      "wheelchair-capable slots today": 0,
      "available time windows": ["9:30 AM", "11:00 AM", "2:00 PM", "3:30 PM", "5:00 PM"],
    },
    dashboardType: "transport",
    tags: ["transport"],
    offerings: {
      transport: {
        clinicTrip: { costType: "estimated", min: 10, max: 16, partnerConfirms: true },
        returnTripAddon: { costType: "fixed", price: 6, partnerConfirms: true },
      },
    },
  },
  {
    id: "eldercare-outreach-navigation-team",
    name: "Eldercare Outreach & Navigation Team",
    description:
      "Senior-focused outreach partner for follow-up, welfare checks, and care navigation.",
    serviceAreas: ["Ang Mo Kio", "Bishan", "Toa Payoh"],
    supportTypes: ["welfare", "referral"],
    supportSubtypes: ["Home visit"],
    capabilities: [
      "Phone check-ins",
      "Home visit requests",
      "Follow-up for vulnerable seniors",
      "Referral/navigation for unclear needs",
    ],
    limitations: ["No physical supplies", "No transport"],
    status: "active",
    availability: "Daytime · multilingual",
    capacity: {
      "welfare check slots today": 10,
      "navigation callback slots today": 6,
      "languages supported": ["English", "Mandarin", "Malay", "Tamil"],
    },
    dashboardType: "outreach",
    tags: ["senior outreach"],
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

// --- final submitted request (consumed by Phase 4) ------------------------

export interface RequestTaskSession {
  id: string;
  supportType: SupportTypeId;
  selectedSubtypes: string[];
  details: Record<string, unknown>;
  primaryOrganisationId: string;
  fallbackOrganisationIds: string[];
  costEstimate?: CostEstimate;
  status: "Sent";
}

export interface RequestSession {
  id: string;
  careRecipientName: string;
  caregiverName: string;
  contactNumber: string;
  contactMethod: string;
  email?: string;
  relationship?: string;
  linkedTopic: string;
  createdAt: string;
  overallStatus: "Sent";
  tasks: RequestTaskSession[];
}

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
