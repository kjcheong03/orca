"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getOrganisation,
  supportTypeLabels,
  type RequestSession,
  type RequestStatus,
  type RequestTaskSession,
} from "@/lib/community";
import { detailRows, requestRef, routeStatus, routeStatusLabel, taskStatus } from "@/lib/contract";

const STATUS_CLS: Record<RequestStatus, string> = {
  Pending: "bg-warn/20 text-[#8a5a00]",
  Accepted: "bg-brand-soft text-brand-dark",
  "In progress": "bg-[#dbeafe] text-[#1e40af]",
  Completed: "bg-[#d6f3e0] text-[#0f7a4a]",
  Rejected: "bg-danger-soft text-[#b42318]",
  Cancelled: "bg-black/[0.06] text-faint",
};

function StatusPill({ status, label }: { status: RequestStatus; label?: string }) {
  const { tx } = useApp();
  // `status` (raw lifecycle) sets the colour; `label` (optional checkpoint) sets the text.
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${STATUS_CLS[status] ?? STATUS_CLS.Pending}`}>
      {tx(label ?? status)}
    </span>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="w-32 shrink-0 text-[12.5px] text-faint">{label}</span>
      <span className="min-w-0 flex-1 text-[13px] text-ink">{value}</span>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
      <p className="text-[12px] font-bold uppercase tracking-wide text-faint">{label}</p>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

export default function RequestDetailModal({
  session,
  task,
  onClose,
}: {
  session: RequestSession;
  task: RequestTaskSession;
  onClose: () => void;
}) {
  const { tx, txf } = useApp();
  const routes = task.fulfilmentRoutes ?? [];
  const partnerRoutes = routes.filter((r) => r.routeType === "partner_service"); // food
  const publicRoutes = routes.filter((r) => r.routeType !== "partner_service"); // supplies
  const fallbackNames = task.fallbackOrganisationIds
    .map((id) => getOrganisation(id)?.name)
    .filter(Boolean) as string[];
  const primaryName = getOrganisation(task.primaryOrganisationId)?.name;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <motion.div
        className="relative flex max-h-[86dvh] w-full max-w-md flex-col rounded-t-[28px] bg-app sm:rounded-[28px]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header status: partner-assigned and supplies (distribution) both show their
            task-level status; food shows none (its per-route lifecycle pills carry it). */}
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2 className="display text-[18px] leading-tight text-ink">
              {tx(supportTypeLabels[task.supportType])}
            </h2>
            <p className="mt-0.5 text-[12px] text-faint">
              {txf("Submitted {when}", { when: formatWhen(session.createdAt) })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Route-based tasks (food + supplies) carry state on per-route pills below;
                only partner-assigned tasks get a single header status (raw lifecycle). */}
            {routes.length === 0 && <StatusPill status={taskStatus(task)} />}
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-sm">
              <X size={18} className="text-ink" />
            </button>
          </div>
        </div>

        <div className="no-scrollbar space-y-4 overflow-y-auto px-5 pb-8">
          {/* Partner-set updates — rejection reason, scheduled time, and notes, shown
              to the caregiver when present (set on the dashboard side). */}
          {task.rejectionReason && (
            <div className="rounded-[18px] bg-danger-soft p-4 ring-1 ring-danger/20">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#b42318]">
                {tx("Why this was declined")}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink">{task.rejectionReason}</p>
            </div>
          )}
          {task.scheduledFor && (
            <div className="rounded-[18px] bg-brand-soft p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-brand-dark">
                {tx("Scheduled for")}
              </p>
              <p className="mt-1 text-[13px] font-semibold text-ink">
                {formatWhen(task.scheduledFor) || task.scheduledFor}
              </p>
            </div>
          )}
          {task.assignedTo && (
            <div className="rounded-[18px] bg-card p-4 ring-1 ring-black/[0.06]">
              <p className="text-[12px] font-bold uppercase tracking-wide text-faint">
                {tx("Assigned to")}
              </p>
              <p className="mt-1 text-[13px] font-semibold text-ink">{task.assignedTo}</p>
            </div>
          )}
          {task.partnerNotes && (
            <div className="rounded-[18px] bg-card p-4 ring-1 ring-black/[0.06]">
              <p className="text-[12px] font-bold uppercase tracking-wide text-faint">
                {tx("Note from the partner")}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink">{task.partnerNotes}</p>
            </div>
          )}

          {/* Food — one card per partner route: its own status + subtype-focused details */}
          {partnerRoutes.map((r) => {
            const rows = detailRows(task, r.label);
            return (
              <section key={r.label} className="rounded-[18px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-ink">{r.routeName}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {tx(r.label)} · {tx(r.costLabel)}
                    </p>
                    {r.displayStatusUpdatedAt && (
                      <p className="mt-0.5 text-[11px] text-faint">
                        {txf("Updated {when}", {
                          when: formatWhen(r.displayStatusUpdatedAt) || r.displayStatusUpdatedAt,
                        })}
                      </p>
                    )}
                  </div>
                  <StatusPill status={routeStatus(r)} label={routeStatusLabel(r)} />
                </div>
                {rows.length > 0 && (
                  <div className="mt-2 divide-y divide-black/[0.05] border-t border-black/[0.05] pt-1">
                    {rows.map((row) => (
                      <Row key={row.label} label={tx(row.label)} value={tx(row.value)} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {/* Supplies — public/community distribution routes (not partner organisations).
              Each route now carries its own collection status (Pending → Completed). */}
          {publicRoutes.length > 0 && (
            <Section label={tx("Distribution")}>
              <div className="space-y-2.5">
                {publicRoutes.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink">
                        {tx(r.label)}
                        {r.quantity ? ` ×${r.quantity}` : ""}
                      </p>
                      <p className="truncate text-[12px] text-muted">{r.routeName}</p>
                      {r.displayStatusUpdatedAt && (
                        <p className="mt-0.5 text-[11px] text-faint">
                          {txf("Updated {when}", {
                            when: formatWhen(r.displayStatusUpdatedAt) || r.displayStatusUpdatedAt,
                          })}
                        </p>
                      )}
                    </div>
                    <StatusPill status={routeStatus(r)} label={routeStatusLabel(r)} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Partner-assigned — primary + backups */}
          {routes.length === 0 && (
            <Section label={tx("Handled by")}>
              <p className="text-[13px] font-semibold text-ink">{primaryName ?? "—"}</p>
              {fallbackNames.length > 0 && (
                <p className="mt-1 text-[12px] text-faint">
                  {txf("Backups: {names}", { names: fallbackNames.join(", ") })}
                </p>
              )}
            </Section>
          )}

          {/* Request details — reference always; field rows for supplies & partner-assigned
              (food shows its fields per-route above, so just the reference here). */}
          <Section label={tx("Request details")}>
            <div className="divide-y divide-black/[0.05]">
              <Row label={tx("Reference")} value={requestRef(session.id)} />
              {partnerRoutes.length === 0 &&
                detailRows(task).map((row) => (
                  <Row key={row.label} label={tx(row.label)} value={tx(row.value)} />
                ))}
            </div>
          </Section>

          {/* Contact */}
          <Section label={tx("Contact")}>
            <div className="divide-y divide-black/[0.05]">
              <Row label={tx("Caregiver")} value={session.caregiverName} />
              <Row label={tx("Contact")} value={`${session.contactNumber} · ${tx(session.contactMethod)}`} />
              {session.email && <Row label={tx("Email")} value={session.email} />}
              <Row label={tx("Care recipient")} value={session.careRecipientName} />
              {session.relationship && <Row label={tx("Relationship")} value={session.relationship} />}
              {session.address ? (
                <>
                  <Row label={tx("Address")} value={session.address} />
                  {session.postalCode && <Row label={tx("Postal code")} value={session.postalCode} />}
                  {session.accessNotes && <Row label={tx("Access notes")} value={session.accessNotes} />}
                </>
              ) : (
                session.generalArea && <Row label={tx("Area")} value={session.generalArea} />
              )}
            </div>
          </Section>
        </div>
      </motion.div>
    </motion.div>
  );
}
