import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  isRouteBasedType,
  type FulfilmentRoute,
  type RequestSession,
  type RequestStatus,
  type RequestTaskSession,
  type RerouteEvent,
  type SupportTypeId,
} from "@/lib/contract";

export const runtime = "nodejs";

interface ItemQuantity {
  item: string;
  quantity?: string | number;
}

// --- helpers ---------------------------------------------------------------

function intOf(v: unknown, fallback = 1): number {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Map CARA dietary restrictions → a single MOW inventory variant slug. */
function dietaryVariant(restrictions: unknown): string {
  const map: Record<string, string> = {
    Halal: "halal",
    Vegetarian: "vegetarian",
    "Soft food": "soft-food",
    "Low sugar": "low-sugar",
    "Low salt": "low-salt",
  };
  const picks = (Array.isArray(restrictions) ? (restrictions as string[]) : []).filter(
    (d) => d && d !== "None",
  );
  if (picks.length === 0) return "regular";
  if (picks.length === 1) return map[picks[0]] ?? "special"; // "Other" → special
  return "special";
}

/** Subtype/item labels that become routes for a route-based task. */
function routeLabels(task: RequestTaskSession): string[] {
  if (task.supportType === "supplies") {
    const items = Array.isArray(task.details.itemsNeeded)
      ? (task.details.itemsNeeded as ItemQuantity[])
      : [];
    return items.map((it) => it.item);
  }
  return task.selectedSubtypes; // food: "Cooked meals" / "Food pack / rations"
}

/** The route-level quantity for a given label. */
function routeQuantity(task: RequestTaskSession, label: string): number {
  if (task.supportType === "supplies") {
    const items = Array.isArray(task.details.itemsNeeded)
      ? (task.details.itemsNeeded as ItemQuantity[])
      : [];
    const it = items.find((i) => i.item === label);
    return intOf(it?.quantity);
  }
  if (label === "Cooked meals") return intOf(task.details.portionsPerMeal);
  if (label === "Food pack / rations") {
    return task.details.numberOfPacks === "Other"
      ? intOf(task.details.numberOfPacksOther)
      : intOf(task.details.numberOfPacks);
  }
  return 1;
}

interface RouteItemSpec {
  workspaceId: string;
  sku: string;
  itemName: string;
  quantity: number;
}

/** Inventory claims for a route (supplies item / food pack / cooked-meal periods). */
function routeItemSpecs(
  task: RequestTaskSession,
  label: string,
  catalog: { workspace_id: string; inventory_sku: string | null },
): RouteItemSpec[] {
  if (task.supportType === "supplies") {
    if (!catalog.inventory_sku) return [];
    return [
      {
        workspaceId: catalog.workspace_id,
        sku: catalog.inventory_sku,
        itemName: label,
        quantity: routeQuantity(task, label),
      },
    ];
  }
  if (label === "Food pack / rations") {
    const fresh = task.details.packType === "Food pack with fresh add-ons, if available";
    return [
      {
        workspaceId: "food-from-the-heart",
        sku: fresh ? "fresh-food-pack" : "standard-food-pack",
        itemName: fresh ? "Fresh food pack" : "Standard food pack",
        quantity: routeQuantity(task, label),
      },
    ];
  }
  if (label === "Cooked meals") {
    const variant = dietaryVariant(task.details.dietaryRestrictions);
    const meals = Array.isArray(task.details.mealsNeeded)
      ? (task.details.mealsNeeded as string[])
      : [];
    const portions = intOf(task.details.portionsPerMeal);
    return meals.map((meal) => {
      const period = meal.toLowerCase(); // "lunch" | "dinner"
      return {
        workspaceId: "touch-meals-on-wheels",
        sku: `${period}-${variant}`,
        itemName: `${meal} · ${variant.replace(/-/g, " ")}`,
        quantity: portions,
      };
    });
  }
  return [];
}

// --- POST: persist a submitted RequestSession ------------------------------

export async function POST(req: Request) {
  let session: RequestSession;
  try {
    session = (await req.json()) as RequestSession;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!session?.id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }
  const sb = supabaseAdmin();

  // Idempotency: the session id is the key. If a row already exists, this POST is
  // a duplicate (double-click / retry) — return ok without re-inserting children.
  const { data: existing } = await sb
    .from("request_sessions")
    .select("id")
    .eq("id", session.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, id: session.id, duplicate: true });
  }

  const { error: sErr } = await sb.from("request_sessions").insert({
    id: session.id,
    care_recipient_name: session.careRecipientName,
    caregiver_name: session.caregiverName,
    contact_number: session.contactNumber,
    contact_method: session.contactMethod,
    // Tag in-app submissions with the demo account email so they show in the curated
    // no-login demo history (the GET filters on email = demo@orca.sg).
    email: session.email || "demo@orca.sg",
    relationship: session.relationship ?? null,
    general_area: session.generalArea ?? null,
    address: session.address ?? null,
    postal_code: session.postalCode ?? null,
    access_notes: session.accessNotes ?? null,
    linked_topic: session.linkedTopic,
    overall_status: "Pending",
  });
  if (sErr) {
    // Lost the race to a concurrent identical POST — the other one wins, this is a dupe.
    if (sErr.code === "23505") {
      return NextResponse.json({ ok: true, id: session.id, duplicate: true });
    }
    return NextResponse.json({ error: sErr.message, at: "session" }, { status: 500 });
  }

  for (const task of session.tasks) {
    const fulfilment = task.fulfilment ?? (isRouteBasedType(task.supportType) ? "route" : "partner");

    const { data: taskRow, error: tErr } = await sb
      .from("request_tasks")
      .insert({
        session_id: session.id,
        task_key: task.id,
        fulfilment,
        support_type: task.supportType,
        selected_subtypes: task.selectedSubtypes,
        details: task.details,
        primary_org_id: fulfilment === "partner" ? task.primaryOrganisationId || null : null,
        fallback_org_ids: task.fallbackOrganisationIds ?? [],
        cost_estimate: task.costEstimate ?? null,
        status: "Pending",
        assigned_to: task.assignedTo ?? null,
        rejection_reason: task.rejectionReason ?? null,
        scheduled_for: task.scheduledFor ?? null,
        partner_notes: task.partnerNotes ?? null,
      })
      .select("id")
      .single();
    if (tErr || !taskRow) {
      return NextResponse.json({ error: tErr?.message ?? "task insert", at: "task" }, { status: 500 });
    }
    const taskId = taskRow.id as string;
    if (fulfilment !== "route") continue;

    for (const label of routeLabels(task)) {
      const { data: cat } = await sb
        .from("fulfilment_route_catalog")
        .select("*")
        .eq("support_type", task.supportType)
        .eq("subtype_label", label)
        .maybeSingle();
      if (!cat) continue; // unknown label → skip (no route)

      const { data: routeRow, error: rErr } = await sb
        .from("request_routes")
        .insert({
          task_id: taskId,
          workspace_id: cat.workspace_id,
          label,
          quantity: routeQuantity(task, label),
          route_name: cat.route_name,
          logo: cat.logo,
          organisation_id: cat.organisation_id, // null for distribution
          route_type: cat.route_type,
          availability_mode: cat.availability_mode,
          cost_label: cat.cost_label,
          detail: cat.detail,
          status: cat.status,
          // Every route gets its own lifecycle now: partner_service advances on the full
          // workflow, distribution on the reduced one (Pending → Completed). Sending an
          // explicit value (not null) keeps each distribution route independently trackable.
          lifecycle: "Pending" as RequestStatus,
        })
        .select("id")
        .single();
      if (rErr || !routeRow) {
        return NextResponse.json({ error: rErr?.message ?? "route insert", at: "route" }, { status: 500 });
      }
      const routeId = routeRow.id as string;

      // Inventory claims (request_route_items). No inventory_movements on submit —
      // the dashboard derives reserved/fulfilled from these + route status.
      for (const spec of routeItemSpecs(task, label, cat)) {
        const { data: inv } = await sb
          .from("inventory_items")
          .select("id, item_name")
          .eq("workspace_id", spec.workspaceId)
          .eq("sku", spec.sku)
          .maybeSingle();
        if (!inv) continue; // unknown SKU → skip the claim
        await sb.from("request_route_items").insert({
          route_id: routeId,
          inventory_item_id: inv.id,
          item_key: spec.sku,
          item_name: spec.itemName || (inv.item_name as string),
          quantity: spec.quantity,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, id: session.id });
}

// --- GET: list sessions (newest first), reshaped to the RequestSession contract ---

type CheckpointRow = {
  stage: string;
  step_order: number;
  completed_at: string;
};

type RouteRow = {
  label: string;
  quantity: number;
  route_name: string;
  logo: string | null;
  organisation_id: string | null;
  workspace_id: string | null;
  route_type: FulfilmentRoute["routeType"];
  availability_mode: FulfilmentRoute["availabilityMode"];
  cost_label: string;
  detail: string | null;
  status: string;
  lifecycle: RequestStatus | null;
  request_route_checkpoints: CheckpointRow[] | null;
};

// Human label for each checkpoint stage — mirrors the dashboard's stage→label mapping
// (the DB stores `stage` + `step_order`, not a label). NOTE: `meal_preparing` is shown
// as "Added to MOW schedule" (not "Meal preparing"), per the cooked-meals flow.
const CHECKPOINT_STAGE_LABELS: Record<string, string> = {
  accepted: "Accepted",
  meal_plan_confirmed: "Meal plan confirmed",
  meal_preparing: "Added to MOW schedule",
  packing: "Packing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
};

/**
 * Derive a route's display status from its checkpoints: the latest one (by completed_at,
 * then step_order) → { label, at }. Null when there are no checkpoints (UI falls back to
 * the raw lifecycle). The dashboard has no display_status column — it derives the same way.
 */
function latestCheckpoint(rows: CheckpointRow[] | null | undefined): { label: string; at: string } | null {
  if (!rows || rows.length === 0) return null;
  const latest = [...rows].sort((a, b) => {
    const dt = new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
    return dt !== 0 ? dt : (b.step_order ?? 0) - (a.step_order ?? 0);
  })[0];
  return { label: CHECKPOINT_STAGE_LABELS[latest.stage] ?? latest.stage, at: latest.completed_at };
}

// Scheduling lives in schedule_assignments (task-linked) — request_tasks.scheduled_for is
// unused by the dashboard. We surface the most-recently-updated assignment for the task.
type ScheduleRow = {
  scheduled_for: string | null;
  status: string | null;
  assignee_name: string | null;
  updated_at: string | null;
};

function latestAssignment(rows: ScheduleRow[] | null | undefined): ScheduleRow | null {
  if (!rows || rows.length === 0) return null;
  return [...rows].sort(
    (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime(),
  )[0];
}

type RerouteRow = {
  task_id: string;
  from_org_id: string;
  to_org_id: string;
  reason: string | null;
  rerouted_at: string;
};

export async function GET() {
  const sb = supabaseAdmin();
  // No caregiver auth yet → serve a curated, no-login demo history by default. The curated
  // caregiver is the single demo account `demo@orca.sg` (008 rows + anything submitted in
  // this app, which we tag with that email on POST). Filtering on this exact email marker
  // hides the dashboard's operational seed (007, demo.caregiver.%@orca.sg) AND any stray
  // null-email test rows. Set DEMO_MODE=false to return everything.
  let query = sb
    .from("request_sessions")
    .select(
      "*, request_tasks(*, request_routes(*, request_route_checkpoints(*)), schedule_assignments(*))",
    )
    .order("created_at", { ascending: false });
  if (process.env.DEMO_MODE !== "false") {
    query = query.is("created_by", null).eq("email", "demo@orca.sg");
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Reroute history: a view the dashboard derives from request_status_events. Guarded —
  // if the view doesn't exist yet, `data` is null and we simply show no reroute banner.
  const { data: rerouteRows } = await sb
    .from("request_reroute_history")
    .select("task_id, from_org_id, to_org_id, reason, rerouted_at");
  const reroutesByTask = new Map<string, RerouteEvent[]>();
  for (const rr of (rerouteRows ?? []) as RerouteRow[]) {
    const list = reroutesByTask.get(rr.task_id) ?? [];
    list.push({
      fromOrgId: rr.from_org_id,
      toOrgId: rr.to_org_id,
      reason: rr.reason ?? undefined,
      reroutedAt: rr.rerouted_at,
    });
    reroutesByTask.set(rr.task_id, list);
  }
  for (const list of reroutesByTask.values()) {
    list.sort((a, b) => new Date(a.reroutedAt).getTime() - new Date(b.reroutedAt).getTime());
  }

  const sessions: RequestSession[] = (data ?? []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    careRecipientName: (s.care_recipient_name as string) ?? "",
    caregiverName: (s.caregiver_name as string) ?? "",
    contactNumber: (s.contact_number as string) ?? "",
    contactMethod: (s.contact_method as string) ?? "",
    email: (s.email as string) ?? undefined,
    relationship: (s.relationship as string) ?? undefined,
    generalArea: (s.general_area as string) ?? undefined,
    address: (s.address as string) ?? undefined,
    postalCode: (s.postal_code as string) ?? undefined,
    accessNotes: (s.access_notes as string) ?? undefined,
    linkedTopic: (s.linked_topic as string) ?? "",
    createdAt: (s.created_at as string) ?? "",
    overallStatus: (s.overall_status as RequestStatus) ?? "Pending",
    tasks: ((s.request_tasks as Record<string, unknown>[]) ?? []).map((t) => {
      const routes = ((t.request_routes as RouteRow[]) ?? []).map((r) => {
        // displayStatus / last-updated are derived from the latest fulfilment checkpoint;
        // the full timeline (checkpoints[]) is intentionally not surfaced to caregivers.
        const cp = latestCheckpoint(r.request_route_checkpoints);
        return {
          label: r.label,
          quantity: Number(r.quantity),
          routeName: r.route_name,
          logo: r.logo ?? undefined,
          organisationId: r.organisation_id ?? undefined,
          workspaceId: r.workspace_id ?? undefined,
          routeType: r.route_type,
          availabilityMode: r.availability_mode,
          costLabel: r.cost_label,
          detail: r.detail ?? undefined,
          status: r.status,
          lifecycle: r.lifecycle ?? undefined,
          displayStatus: cp?.label,
          displayStatusUpdatedAt: cp?.at,
        };
      });
      const sa = latestAssignment(t.schedule_assignments as ScheduleRow[] | null);
      return {
        id: (t.task_key as string) ?? (t.support_type as string),
        fulfilment: t.fulfilment as "route" | "partner",
        supportType: t.support_type as SupportTypeId,
        selectedSubtypes: (t.selected_subtypes as string[]) ?? [],
        details: (t.details as Record<string, unknown>) ?? {},
        primaryOrganisationId: (t.primary_org_id as string) ?? "",
        fallbackOrganisationIds: (t.fallback_org_ids as string[]) ?? [],
        fulfilmentRoutes: routes.length ? routes : undefined,
        costEstimate: (t.cost_estimate as RequestTaskSession["costEstimate"]) ?? undefined,
        status: (t.status as RequestStatus) ?? "Pending",
        assignedTo: sa?.assignee_name ?? (t.assigned_to as string) ?? undefined,
        rejectionReason: (t.rejection_reason as string) ?? undefined,
        scheduledFor: sa?.scheduled_for ?? (t.scheduled_for as string) ?? undefined,
        scheduleStatus: sa?.status ?? undefined,
        partnerNotes: (t.partner_notes as string) ?? undefined,
        reroutes: reroutesByTask.get(t.id as string),
      };
    }),
  }));

  return NextResponse.json(sessions);
}
