# Spec — Per-channel distribution status (dashboard repo)

**Audience:** the agent on `cara-community-dashboard`.
**Author:** CARA app side. **Status:** ready to implement.
**Why:** a supplies request fans out to multiple distribution channels (e.g. Masks → Temasek,
ART kits → MOH). Today they share **one** task-level status, so "masks collected, ART kits
not yet" can't be expressed. We want each distribution **route** independently advanceable and
displayable — using the existing `request_status` enum on the **reduced** lifecycle
(`Pending → Completed | Cancelled`; distribution has no actor that accepts/rejects).

Labels stay the plain `RequestStatus` words everywhere (Pending / In progress / Completed /
Cancelled) — no distribution-specific vocabulary. Consistency is the product decision.

---

## Current state (verified in `db/001_cara_community_dashboard_schema.sql`)

- `request_routes.lifecycle` (nullable `request_status`) exists, **but** CHECK constraint
  `request_routes_distribution_has_no_lifecycle` (line ~278) forbids it on distribution routes:
  `route_type = 'partner_service' OR lifecycle IS NULL`.
- `route_effective_status(route)`: `partner_service` → `coalesce(lifecycle,'Pending')`;
  distribution → **parent task `status`** (it ignores the route's own lifecycle).
- `task_effective_status(task)`: rolls up **only** `partner_service` route lifecycles; otherwise
  returns `task.status`. `refresh_task_status` skips recomputing route-based tasks that have no
  partner_service routes (it only refreshes the session rollup).
- `inventory_dashboard` reserved/fulfilled already keys off `route_effective_status(route_id)`
  **per route** — so inventory is *already* route-granular; it just currently reads the task
  status for distribution routes.
- `workspace_work_items` view already emits `item_kind = 'supplies-route'` per distribution route
  (line ~953). So the DB already models supplies at route grain in the work-items view.
- Distribution routes have `organisation_id = NULL` and belong to a **workspace**
  (e.g. `temasek-distribution`). Owner-scoping for supplies is by **workspace_id**, not org.

So the per-route machinery is mostly there; the lifecycle source + the constraint are the gaps.

---

## Changes (dashboard repo)

1. **Constraint** — drop/replace `request_routes_distribution_has_no_lifecycle` so distribution
   routes may carry a lifecycle. Give distribution routes a **default `'Pending'`** (column
   default or insert trigger) so `lifecycle` is never null for them — this avoids the
   read-from-task fallback ambiguity in step 2. (CARA will also start sending
   `lifecycle: 'Pending'` for distribution routes once the constraint is lifted — see below.)

2. **`route_effective_status`** — for distribution routes return
   `coalesce(route.lifecycle, <parent task status>, 'Pending')`, preferring the route's own
   lifecycle. This makes `inventory_dashboard` per-route automatically (no view change).

3. **Transitions** — distribution routes advance on the **reduced** scope.
   `allowed_request_transitions(status, 'reduced')` already returns `Pending → [Completed,
   Cancelled]`. Wire the route status-change action to pass `'reduced'` for non-`partner_service`
   routes. *(Optional: add `'In progress'` = "ready for collection / out for delivery" to the
   reduced set — here and in `TRANSITIONS.reduced` in the contract — if you want a mid-state.
   CARA will display it. Default: keep binary `Pending → Completed`.)*

4. **Task / session rollup** — extend `task_effective_status` so route-based tasks roll up **all**
   routes' effective statuses (partner_service **and** distribution), not just partner_service;
   and make `refresh_task_status` recompute route-based task status from routes (today it skips
   non-partner tasks). This keeps `overall_status` correct when only some distribution routes are
   done (masks Completed + ART kits Pending → task rolls up to Pending/In progress, not Completed).

5. **Status events** — log distribution route transitions to `request_status_events` with
   `route_id` set, same as partner routes (audit/history).

6. **Dashboard UI** — the supplies work item becomes per-route (the `supplies-route` kind already
   exists in `workspace_work_items`). Give distribution-workspace users a control to advance each
   route `Pending → Completed` (and Cancel). **Scope by `workspace_id`** (org is null for
   distribution).

---

## Shared contract (`lib/contract.ts` — both repos; CARA will re-sync)

- `WorkItem.kind`: add `"supplies-route"`. Change `flattenToWorkItems` to emit one
  `supplies-route` item **per distribution route** (status = `route.lifecycle ?? 'Pending'`,
  `transitions = TRANSITIONS.reduced[status]`, scope by the route's workspace; `ownerOrgId` stays
  null). This replaces the current single task-level `supplies-task` item.
- Already present and ready to use: `FulfilmentRoute.lifecycle`, `TRANSITIONS.reduced`,
  `isDistributionTask`, `taskStatus`.
- **Re-sync note:** CARA's contract now also exports `taskStatus()` and `isDistributionTask()` —
  pull the latest copy.

---

## After it lands (CARA side — we do this)

- In `app/api/requests/route.ts`, send `lifecycle: 'Pending'` for distribution routes on submit
  (currently null).
- In the caregiver UI, render **each supplies route line with its own status pill**
  (`route.lifecycle ?? 'Pending'`, plain `RequestStatus` labels) and drop the single task-level
  supplies badge. No further schema work.

---

## Out of scope / non-goals

- No accept/reject for distribution (no actor declines a public exercise) — reduced lifecycle only.
- No `inventory_movements` written on caregiver submit (unchanged); the view derives
  reserved/fulfilled from route status.
