// ---------------------------------------------------------------------------
// CARA request contract — SINGLE SOURCE OF TRUTH.
//
// Producer: the CARA caregiver app (emits RequestSession on submit).
// Consumer: the community-partner dashboard kit (imports a synced copy).
//
// Zero-dependency, pure TypeScript. Do not import app/UI code here.
// The caregiver app re-exports these from lib/community.ts for back-compat.
// ---------------------------------------------------------------------------

// --- support types ---------------------------------------------------------

export type SupportTypeId = "supplies" | "food" | "welfare" | "transport" | "referral";

export const supportTypeLabels: Record<SupportTypeId, string> = {
  supplies: "Health / emergency supplies",
  food: "Food / meal support",
  welfare: "Welfare check",
  transport: "Assisted transport",
  referral: "Care referral / navigation",
};

/** Route-based support types fan out to fulfilment routes; the rest are partner-assigned. */
export const ROUTE_BASED_TYPES: SupportTypeId[] = ["supplies", "food"];
export function isRouteBasedType(type: SupportTypeId): boolean {
  return ROUTE_BASED_TYPES.includes(type);
}

// --- lifecycle status ------------------------------------------------------

/**
 * Lifecycle of a request / task / route, mirroring the partner dashboard.
 * New submissions start "Pending"; partners advance them. (No backend yet, so
 * the caregiver app only ever emits/sees "Pending" until write-back lands.)
 */
export type RequestStatus =
  | "Pending"
  | "Accepted"
  | "In progress"
  | "Completed"
  | "Rejected"
  | "Cancelled";

/** Allowed status transitions, by fulfilment kind. */
export const TRANSITIONS: Record<"full" | "reduced", Record<RequestStatus, RequestStatus[]>> = {
  // partner_service routes (food) + all partner-assigned tasks — an accountable actor can act.
  full: {
    Pending: ["Accepted", "Rejected"],
    Accepted: ["In progress", "Cancelled"],
    "In progress": ["Completed", "Cancelled"],
    Completed: [],
    Rejected: [],
    Cancelled: [],
  },
  // public / community distribution (supplies) — no actor to accept or reject.
  reduced: {
    Pending: ["Completed", "Cancelled"],
    Accepted: [],
    "In progress": [],
    Completed: [],
    Rejected: [],
    Cancelled: [],
  },
};

/**
 * Roll a set of child statuses up to a parent (route→task for food, task→session).
 * Patched so every terminal combination is covered.
 */
export function rollupStatus(statuses: RequestStatus[]): RequestStatus {
  if (statuses.length === 0) return "Pending";
  if (statuses.includes("Pending")) return "Pending";
  if (statuses.some((s) => s === "Accepted" || s === "In progress")) return "In progress";
  // everything terminal from here
  if (statuses.some((s) => s === "Completed")) return "Completed"; // partial success reads better than failure
  if (statuses.some((s) => s === "Rejected")) return "Rejected"; // a rejection is more actionable than a cancellation
  return "Cancelled"; // all cancelled
}

// --- cost ------------------------------------------------------------------

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
  /** Display override for the cost chip (e.g. "Free / partner assessment"). */
  label?: string;
  /** Explanatory line shown beneath the chip. */
  detail?: string;
  min?: number;
  max?: number;
  total?: number;
  currency: "SGD";
  partnerConfirms: boolean;
  paymentHandledBy?: "partner";
  breakdown: CostBreakdownLine[];
}

// --- fulfilment routes -----------------------------------------------------

export type SupplyAvailabilityMode =
  | "active_distribution_exercise"
  | "local_stock_subject_to_availability"
  | "partner_assessment"
  | "unavailable";

/** One operational checkpoint in a route's fulfilment timeline (dashboard/operator-set). */
export interface FulfilmentCheckpoint {
  stage: string;
  label: string;
  completedAt: string;
  actorName?: string;
  notes?: string;
}

/** A per-item (supplies) / per-subtype (food) fulfilment route. */
export interface FulfilmentRoute {
  label: string;
  quantity?: number;
  routeName: string;
  /** Logo path under /public; falls back to a letter. */
  logo?: string;
  /** Real partner-org id when the route is a `partner_service` (food); absent for public exercises. */
  organisationId?: string;
  /** Workspace the route belongs to (a distribution workspace, or the partner org's workspace for food). */
  workspaceId?: string;
  routeType: "public_distribution" | "community_distribution" | "partner_service";
  availabilityMode: SupplyAvailabilityMode;
  costLabel: string;
  detail?: string;
  /** Availability note emitted by the producer (e.g. "Available while stock lasts"). NOT a lifecycle state. */
  status: string;
  /** Workflow state — dashboard-set, meaningful ONLY for `partner_service` routes (food). */
  lifecycle?: RequestStatus;
  /**
   * Operational-checkpoint label set by the dashboard (e.g. "Packing", "Ready for pickup",
   * "Out for delivery"). Used for the pill TEXT only; the raw `lifecycle` still drives
   * colour + open/closed. Falls back to `lifecycle` when absent.
   */
  displayStatus?: string;
  /** When `displayStatus` was last set (ISO) — shown as "last updated" in the detail view. */
  displayStatusUpdatedAt?: string;
  /**
   * Full operational checkpoint history (operator timeline). Typed for contract parity but
   * NOT rendered on the caregiver side — caregivers see only displayStatus + its updated time.
   */
  checkpoints?: FulfilmentCheckpoint[];
}

/**
 * A reroute event for a partner-assigned task: the primary partner declined, so the
 * dashboard auto-promoted the next fallback to primary. Read from the dashboard's
 * `request_reroute_history` view; surfaced as additive context (a banner), not status.
 */
export interface RerouteEvent {
  fromOrgId: string;
  toOrgId: string;
  reason?: string;
  reroutedAt: string;
}

// --- request session (what the producer emits on submit) -------------------

export interface RequestTaskSession {
  /** Per-session id (currently the support type — unique within a session, not globally). */
  id: string;
  /** Discriminant: route-based (supplies/food) vs partner-assigned (welfare/transport/referral). */
  fulfilment: "route" | "partner";
  supportType: SupportTypeId;
  selectedSubtypes: string[];
  details: Record<string, unknown>;
  /** Partner-assigned only; "" for route-based. */
  primaryOrganisationId: string;
  fallbackOrganisationIds: string[];
  /** Route-based only (supplies + food). */
  fulfilmentRoutes?: FulfilmentRoute[];
  /** Partner-assigned only. */
  costEstimate?: CostEstimate;
  status: RequestStatus;
  // --- dashboard-set workflow fields (absent at submit) ---
  assignedTo?: string;
  rejectionReason?: string;
  scheduledFor?: string;
  /** Schedule state from the partner's schedule assignment (e.g. "Scheduled", "Rescheduled"). */
  scheduleStatus?: string;
  partnerNotes?: string;
  /**
   * Reroute history (partner-assigned tasks): each time the primary declined and the task
   * was promoted to a fallback, chronological. Surfaced as a banner; raw status is unaffected.
   */
  reroutes?: RerouteEvent[];
}

export interface RequestSession {
  id: string;
  careRecipientName: string;
  caregiverName: string;
  contactNumber: string;
  contactMethod: string;
  email?: string;
  relationship?: string;
  /** Location — present only when the request collected it. */
  generalArea?: string;
  address?: string;
  postalCode?: string;
  accessNotes?: string;
  linkedTopic: string;
  createdAt: string;
  overallStatus: RequestStatus;
  tasks: RequestTaskSession[];
}

// --- discrimination guards (robust to pre-discriminant stored data) --------

export function isRouteBased(task: RequestTaskSession): boolean {
  return task.fulfilment ? task.fulfilment === "route" : isRouteBasedType(task.supportType);
}
export function isPartnerAssigned(task: RequestTaskSession): boolean {
  return !isRouteBased(task);
}

/**
 * A task's effective status: for route-based tasks (food + supplies) it's the rollup of
 * each route's lifecycle; for partner-assigned tasks it's the task's own status. Use this
 * as the parent/summary status — the per-route lifecycles are shown alongside it.
 */
export function taskStatus(task: RequestTaskSession): RequestStatus {
  // Route-based tasks (food + supplies) now carry per-route lifecycles — roll them up so
  // the effective status reflects every channel. Partner-assigned tasks use their own status.
  const routes = task.fulfilmentRoutes ?? [];
  if (routes.length) return rollupStatus(routes.map((r) => r.lifecycle ?? "Pending"));
  return task.status;
}

/**
 * A route-based task whose routes are all public/community distribution (no partner
 * service). Its workflow lives on the task-level `status` (the `reduced` lifecycle),
 * not on the routes (which carry availability only).
 */
export function isDistributionTask(task: RequestTaskSession): boolean {
  const routes = task.fulfilmentRoutes ?? [];
  return isRouteBased(task) && routes.length > 0 && !routes.some((r) => r.routeType === "partner_service");
}

/** Terminal (closed) statuses — nothing more will happen on this request. */
export function isTerminalStatus(status: RequestStatus): boolean {
  return status === "Completed" || status === "Rejected" || status === "Cancelled";
}

/**
 * Human-facing reference code for a session id. The stored id is `req-<ms>`; we show a
 * compact base-36 code (e.g. "REQ-LZ4K9P") so it reads like a real reference number and
 * can be quoted to a partner or to support. Deterministic — no extra storage.
 */
export function requestRef(sessionId: string): string {
  const raw = sessionId.replace(/^req-/, "");
  const n = Number(raw);
  const code = Number.isFinite(n) && raw !== "" ? n.toString(36).toUpperCase() : raw.toUpperCase();
  return `REQ-${code}`;
}

// --- status summaries (shared display shape for caregiver + dashboard) ------
// Pre-flattened status objects so both apps render the same thing without each
// re-deriving status / terminal / per-route state.

/** A single route's current lifecycle (distribution + partner_service alike). */
export function routeStatus(route: FulfilmentRoute): RequestStatus {
  return route.lifecycle ?? "Pending";
}

// --- pill TEXT (display) vs lifecycle (colour + open/closed) ----------------
// The pill TEXT may prefer a richer operational-checkpoint label when the dashboard
// supplies one; the raw RequestStatus from routeStatus()/taskStatus() still decides
// the pill colour and the open/closed split. These return strings (a checkpoint label
// isn't always one of the RequestStatus values).

/** Pill text for a route: the checkpoint label if set, else the raw lifecycle. */
export function routeStatusLabel(route: FulfilmentRoute): string {
  return route.displayStatus?.trim() || routeStatus(route);
}

/**
 * Pill text for a task. A partner-assigned task that's been scheduled (raw status still
 * "In progress" with a scheduled time) reads as "Scheduled" — or "Rescheduled" when the
 * partner moved the slot. Everything else shows the raw effective status. Colour and
 * open/closed still come from taskStatus().
 */
export function taskStatusLabel(task: RequestTaskSession): string {
  const status = taskStatus(task);
  if (isPartnerAssigned(task) && status === "In progress" && task.scheduledFor) {
    return task.scheduleStatus === "Rescheduled" ? "Rescheduled" : "Scheduled";
  }
  return status;
}

export interface RouteStatusSummary {
  label: string;
  routeName: string;
  workspaceId?: string;
  routeType: FulfilmentRoute["routeType"];
  status: RequestStatus;
  isTerminal: boolean;
}

export interface TaskStatusSummary {
  id: string;
  supportType: SupportTypeId;
  selectedSubtypes: string[];
  /** Effective status (route rollup for route-based tasks, else the task's own). */
  status: RequestStatus;
  /** The task's own stored status, before route rollup. */
  rawStatus: RequestStatus;
  isTerminal: boolean;
  rejectionReason?: string;
  scheduledFor?: string;
  partnerNotes?: string;
  routes: RouteStatusSummary[];
}

export interface RequestStatusSummary {
  requestRef: string;
  sessionId: string;
  overallStatus: RequestStatus;
  isTerminal: boolean;
  tasks: TaskStatusSummary[];
}

export function taskStatusSummary(task: RequestTaskSession): TaskStatusSummary {
  const status = taskStatus(task);
  return {
    id: task.id,
    supportType: task.supportType,
    selectedSubtypes: task.selectedSubtypes,
    status,
    rawStatus: task.status,
    isTerminal: isTerminalStatus(status),
    rejectionReason: task.rejectionReason,
    scheduledFor: task.scheduledFor,
    partnerNotes: task.partnerNotes,
    routes: (task.fulfilmentRoutes ?? []).map((route) => {
      const s = routeStatus(route);
      return {
        label: route.label,
        routeName: route.routeName,
        workspaceId: route.workspaceId,
        routeType: route.routeType,
        status: s,
        isTerminal: isTerminalStatus(s),
      };
    }),
  };
}

export function requestStatusSummary(session: RequestSession): RequestStatusSummary {
  return {
    requestRef: requestRef(session.id),
    sessionId: session.id,
    overallStatus: session.overallStatus,
    isTerminal: isTerminalStatus(session.overallStatus),
    tasks: session.tasks.map(taskStatusSummary),
  };
}

// --- work items (the dashboard's atomic, owner-scoped unit) ----------------
//
// Routed tasks fan out per route: a food task with cooked-meals + food-pack produces
// two `food-route` items owned by two different orgs; a supplies task produces one
// `supplies-route` per distribution channel (masks, ART kits, …), each with its own
// reduced lifecycle. Distribution routes have no partner org — they belong to a
// distribution workspace — so they surface in the unscoped/admin view.

export interface WorkItem {
  /** Stable id: `${sessionId}:${supportType}` or `${sessionId}:${supportType}:${routeLabel}`. */
  id: string;
  sessionId: string;
  ownerOrgId: string | null;
  relation: "primary" | "backup" | "owner";
  supportType: SupportTypeId;
  kind: "partner-task" | "supplies-route" | "food-route";
  status: RequestStatus;
  transitions: RequestStatus[];
  task: RequestTaskSession;
  route?: FulfilmentRoute;
  session: RequestSession;
}

/**
 * Flatten sessions into owner-scoped work items. Pass `orgId` to scope to one
 * partner (sees its partner-assigned tasks where it's primary/backup, and its
 * own food routes). Omit `orgId` for an unscoped/admin view (also surfaces
 * supplies routes, which have no partner owner — they belong to a workspace).
 */
export function flattenToWorkItems(sessions: RequestSession[], orgId?: string): WorkItem[] {
  const items: WorkItem[] = [];

  for (const session of sessions) {
    for (const task of session.tasks) {
      if (isPartnerAssigned(task)) {
        const isPrimary = task.primaryOrganisationId === orgId;
        const isBackup = task.fallbackOrganisationIds.includes(orgId ?? "");
        if (orgId && !isPrimary && !isBackup) continue;
        items.push({
          id: `${session.id}:${task.supportType}`,
          sessionId: session.id,
          ownerOrgId: task.primaryOrganisationId || null,
          relation: isBackup && !isPrimary ? "backup" : "primary",
          supportType: task.supportType,
          kind: "partner-task",
          status: task.status,
          transitions: TRANSITIONS.full[task.status],
          task,
          session,
        });
        continue;
      }

      // route-based — one work item per route
      const routes = task.fulfilmentRoutes ?? [];
      for (const route of routes) {
        const status = route.lifecycle ?? "Pending";
        if (route.routeType === "partner_service") {
          // food — owned by the route's org; full lifecycle (accept/reject/…)
          if (orgId && route.organisationId !== orgId) continue;
          items.push({
            id: `${session.id}:${task.supportType}:${route.label}`,
            sessionId: session.id,
            ownerOrgId: route.organisationId ?? null,
            relation: "owner",
            supportType: task.supportType,
            kind: "food-route",
            status,
            transitions: TRANSITIONS.full[status],
            task,
            route,
            session,
          });
        } else {
          // supplies — distribution channel; reduced lifecycle (Pending → Completed),
          // owned by a distribution workspace (no partner org). Scope to that workspace.
          if (orgId && route.workspaceId !== orgId) continue;
          items.push({
            id: `${session.id}:${task.supportType}:${route.label}`,
            sessionId: session.id,
            ownerOrgId: route.workspaceId ?? null,
            relation: "owner",
            supportType: task.supportType,
            kind: "supplies-route",
            status,
            transitions: TRANSITIONS.reduced[status],
            task,
            route,
            session,
          });
        }
      }
    }
  }

  return items;
}

// --- derived display helpers (priority · needed-by · detail rows) ----------
// Shared so the dashboard renders identically to the form, instead of re-guessing.

export type UrgencyTier = "high" | "medium" | "low";

function str(details: Record<string, unknown>, key: string): string {
  const v = details[key];
  if (typeof v === "string") return v.trim();
  return v != null && typeof v !== "object" ? String(v) : "";
}
function list(details: Record<string, unknown>, key: string): string[] {
  const v = details[key];
  return Array.isArray(v) ? (v as unknown[]).map((x) => String(x)) : [];
}

const HIGH_TOKENS = new Set(["today", "today, if available"]);
const MEDIUM_TOKENS = new Set(["tomorrow", "within 2–3 days", "2–3 days", "this week"]);

function tierFromToken(raw: string): UrgencyTier | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (HIGH_TOKENS.has(t)) return "high";
  if (MEDIUM_TOKENS.has(t)) return "medium";
  if (t === "not urgent") return "low";
  return null;
}
function tierFromDate(targetIso: string, refIso?: string): UrgencyTier | null {
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;
  const ref = refIso ? new Date(refIso).getTime() : Date.now();
  const days = Math.floor((target - ref) / 86_400_000);
  if (days <= 0) return "high"; // due today or overdue
  if (days <= 3) return "medium";
  return "low";
}
const TIER_RANK: Record<UrgencyTier, number> = { high: 3, medium: 2, low: 1 };
function maxTier(...tiers: (UrgencyTier | null)[]): UrgencyTier {
  const present = tiers.filter((t): t is UrgencyTier => t != null);
  return present.length ? present.reduce((a, b) => (TIER_RANK[b] > TIER_RANK[a] ? b : a)) : "low";
}

/** Priority tier, derived from each support type's own timing field. `refIso` = the request's createdAt. */
export function deriveUrgency(task: RequestTaskSession, refIso?: string): UrgencyTier {
  const d = task.details;
  switch (task.supportType) {
    case "supplies":
      return tierFromToken(str(d, "neededBy")) ?? "low";
    case "food": {
      const cooked =
        str(d, "startDate") === "Choose date"
          ? tierFromDate(str(d, "startDateValue"), refIso)
          : tierFromToken(str(d, "startDate"));
      return maxTier(cooked, tierFromToken(str(d, "neededBy")));
    }
    case "welfare":
      return (
        (str(d, "checkInDay") === "Choose date"
          ? tierFromDate(str(d, "checkInDayValue"), refIso)
          : tierFromToken(str(d, "checkInDay"))) ?? "low"
      );
    case "referral":
      return tierFromToken(str(d, "urgency")) ?? "low";
    case "transport":
      return tierFromDate(str(d, "appointmentDateTime"), refIso) ?? "low";
    default:
      return "low";
  }
}

function fmtDate(iso: string, withTime = false): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const date = dt.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  if (!withTime) return date;
  return `${date}, ${dt.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })}`;
}
function resolveToken(token: string, refIso?: string): string {
  const t = token.trim().toLowerCase();
  if (!refIso) return token;
  if (t === "today" || t === "today, if available") return fmtDate(refIso);
  if (t === "tomorrow") {
    const d = new Date(refIso);
    d.setDate(d.getDate() + 1);
    return fmtDate(d.toISOString());
  }
  return token; // relative windows stay as phrases
}

/** Concrete "needed by" — exact date/time where one exists, window phrase otherwise. */
export function neededByLabel(task: RequestTaskSession, refIso?: string): string {
  const d = task.details;
  switch (task.supportType) {
    case "supplies":
      return resolveToken(str(d, "neededBy"), refIso);
    case "food":
      if (str(d, "startDate"))
        return str(d, "startDate") === "Choose date"
          ? fmtDate(str(d, "startDateValue"))
          : resolveToken(str(d, "startDate"), refIso);
      return resolveToken(str(d, "neededBy"), refIso);
    case "welfare":
      return str(d, "checkInDay") === "Choose date"
        ? fmtDate(str(d, "checkInDayValue"))
        : resolveToken(str(d, "checkInDay"), refIso);
    case "referral":
      return str(d, "urgency");
    case "transport":
      return str(d, "appointmentDateTime") ? fmtDate(str(d, "appointmentDateTime"), true) : "";
    default:
      return "";
  }
}

export interface DetailRow {
  label: string;
  value: string;
}

/**
 * The submitted request fields as label→value rows, mirroring the caregiver form
 * exactly (per support type, conditionals included). For food, pass `focusSubtype`
 * (a route's label) to show only that subtype's fields.
 */
export function detailRows(task: RequestTaskSession, focusSubtype?: string): DetailRow[] {
  const d = task.details;
  const rows: DetailRow[] = [];
  const push = (label: string, value: string) => {
    if (value && value.trim()) rows.push({ label, value: value.trim() });
  };
  const yesno = (label: string, key: string) => {
    if (d[key] === true) rows.push({ label, value: "Yes" });
  };

  switch (task.supportType) {
    case "supplies": {
      const items = Array.isArray(d.itemsNeeded)
        ? (d.itemsNeeded as { item: string; quantity?: string | number }[])
        : [];
      push(
        "Items",
        items
          .filter((i) => i.quantity)
          .map((i) => `${i.item}${i.quantity ? ` ×${i.quantity}` : ""}`)
          .join(", "),
      );
      push("Needed by", str(d, "neededBy"));
      push("Fulfilment", str(d, "suppliesFulfilment"));
      push("Preferred collection area", str(d, "preferredCollectionArea"));
      push("Preferred time", str(d, "preferredCollectionTime") || str(d, "preferredDeliveryTime"));
      push("Notes", str(d, "notes"));
      break;
    }
    case "food": {
      const cooked = focusSubtype ? focusSubtype === "Cooked meals" : true;
      const pack = focusSubtype ? focusSubtype === "Food pack / rations" : true;
      if (cooked && (str(d, "portionsPerMeal") || list(d, "mealsNeeded").length)) {
        push("Portions per meal", str(d, "portionsPerMeal"));
        push("Meals", list(d, "mealsNeeded").join(" + "));
        push("Start", str(d, "startDate") === "Choose date" ? str(d, "startDateValue") : str(d, "startDate"));
        push("Duration", str(d, "duration"));
        push(
          "Dietary restrictions",
          [list(d, "dietaryRestrictions").join(", "), str(d, "dietaryRestrictionsOther")]
            .filter(Boolean)
            .join(" · "),
        );
        push("Preferred delivery time", str(d, "preferredDeliveryTime"));
      }
      if (pack && (str(d, "packType") || str(d, "numberOfPacks"))) {
        push("Pack type", str(d, "packType"));
        push("Number of packs", str(d, "numberOfPacks") === "Other" ? str(d, "numberOfPacksOther") : str(d, "numberOfPacks"));
        push("Needed by", str(d, "neededBy"));
        push("Fulfilment", str(d, "fulfilmentMethod"));
        push("Preferred delivery window", str(d, "preferredDeliveryWindow"));
        push("Preferred pickup area", str(d, "pickupArea"));
        push("Preferred pickup time", str(d, "pickupTime"));
        push("Preferred area", str(d, "generalPreferredArea"));
        push("Timing", str(d, "timingConstraints"));
        push("Access notes", str(d, "packAccessNotes"));
        push(
          "Food restrictions",
          [list(d, "foodRestrictions").join(", "), str(d, "restrictionNotes")].filter(Boolean).join(" · "),
        );
      }
      push("Notes", str(d, "notes"));
      break;
    }
    case "welfare": {
      push("Specify", str(d, "specifyOther"));
      push("Check method", str(d, "checkMethod"));
      push("When", str(d, "checkInDay") === "Choose date" ? str(d, "checkInDayValue") : str(d, "checkInDay"));
      push("Preferred time", str(d, "preferredTime"));
      push("Preferred language", str(d, "language"));
      push("Safety notes", str(d, "safetyNotes"));
      push("Notes", str(d, "notes"));
      break;
    }
    case "transport": {
      push("Destination", str(d, "destination"));
      push("Appointment", str(d, "appointmentDateTime") ? fmtDate(str(d, "appointmentDateTime"), true) : "");
      // Pickup is the home address (shown under Contact), not a separate field.
      yesno("Wheelchair required", "wheelchairRequired");
      yesno("Escort needed", "escortNeeded");
      yesno("Caregiver accompanying", "caregiverAccompanying");
      yesno("Return trip", "returnTripNeeded");
      push("Mobility notes", str(d, "mobilityNeeds"));
      push("Notes", str(d, "notes"));
      break;
    }
    case "referral": {
      push("Specify", str(d, "specifyOther"));
      push("Main concern", str(d, "mainConcern"));
      push("Current situation", str(d, "currentSituation"));
      push("When to contact", str(d, "urgency"));
      push("Preferred language", str(d, "language"));
      push("Existing support", str(d, "existingSupport"));
      push("Notes", str(d, "notes"));
      break;
    }
  }
  return rows;
}
