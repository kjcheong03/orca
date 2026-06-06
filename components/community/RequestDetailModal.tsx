"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getOrganisation,
  getSupportTemplate,
  isFieldVisible,
  supportTypeLabels,
  type FormField,
  type ItemQuantity,
  type RequestSession,
  type RequestStatus,
  type RequestTaskSession,
} from "@/lib/community";

const STATUS_CLS: Record<RequestStatus, string> = {
  Pending: "bg-warn/20 text-[#8a5a00]",
  Accepted: "bg-[#d6f3e0] text-[#0f7a4a]",
  Rejected: "bg-danger-soft text-[#b42318]",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

/** A human-readable value for a submitted field, or null to skip it. */
function fieldValue(field: FormField, details: Record<string, unknown>): string | null {
  if (field.kind === "note") return null;
  const v = details[field.key];
  if (field.kind === "itemQuantities") {
    const arr = Array.isArray(v) ? (v as ItemQuantity[]) : [];
    const s = arr
      .filter((it) => it.quantity)
      .map((it) => `${it.item}${it.quantity ? ` ×${it.quantity}` : ""}`)
      .join(", ");
    return s || null;
  }
  if (field.kind === "toggle") return v === true ? "Yes" : null;
  if (Array.isArray(v)) return v.length ? (v as string[]).join(", ") : null;
  const s = typeof v === "string" ? v.trim() : v != null ? String(v) : "";
  return s || null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="w-32 shrink-0 text-[12.5px] text-faint">{label}</span>
      <span className="min-w-0 flex-1 text-[13px] text-ink">{value}</span>
    </div>
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
  const tmpl = getSupportTemplate(task.supportType);
  const detailFields = (tmpl?.fields ?? [])
    .filter((f) => isFieldVisible(f, task.details, task.selectedSubtypes))
    .map((f) => ({ label: f.label, value: fieldValue(f, task.details) }))
    .filter((r): r is { label: string; value: string } => !!r.value);

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
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2 className="display text-[18px] leading-tight text-ink">
              {tx(supportTypeLabels[task.supportType])}
            </h2>
            <p className="mt-0.5 text-[12px] text-faint">{txf("Submitted {when}", { when: formatWhen(session.createdAt) })}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${STATUS_CLS[task.status] ?? STATUS_CLS.Pending}`}>
              {tx(task.status)}
            </span>
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-sm">
              <X size={18} className="text-ink" />
            </button>
          </div>
        </div>

        <div className="no-scrollbar space-y-4 overflow-y-auto px-5 pb-8">
          {/* Handled by */}
          <section className="rounded-[18px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
            <p className="text-[12px] font-bold uppercase tracking-wide text-faint">{tx("Handled by")}</p>
            {task.fulfilmentRoutes?.length ? (
              <ul className="mt-2 space-y-1.5">
                {task.fulfilmentRoutes.map((r) => (
                  <li key={r.label} className="text-[13px]">
                    <span className="font-semibold text-ink">
                      {tx(r.label)}
                      {r.quantity ? ` ×${r.quantity}` : ""}
                    </span>
                    <span className="text-muted"> → {r.routeName}</span>
                    <span className="block text-[12px] text-faint">{tx(r.costLabel)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-1.5 text-[13px]">
                <p className="font-semibold text-ink">{primaryName ?? "—"}</p>
                {fallbackNames.length > 0 && (
                  <p className="mt-1 text-[12px] text-faint">{txf("Backups: {names}", { names: fallbackNames.join(", ") })}</p>
                )}
              </div>
            )}
          </section>

          {/* Request details */}
          {detailFields.length > 0 && (
            <section className="rounded-[18px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
              <p className="text-[12px] font-bold uppercase tracking-wide text-faint">{tx("Request details")}</p>
              <div className="mt-1.5 divide-y divide-black/[0.05]">
                {detailFields.map((r) => (
                  <Row key={r.label} label={tx(r.label)} value={tx(r.value)} />
                ))}
              </div>
            </section>
          )}

          {/* Contact */}
          <section className="rounded-[18px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
            <p className="text-[12px] font-bold uppercase tracking-wide text-faint">{tx("Contact")}</p>
            <div className="mt-1.5 divide-y divide-black/[0.05]">
              <Row label={tx("Caregiver")} value={session.caregiverName} />
              <Row
                label={tx("Contact")}
                value={`${session.contactNumber} · ${tx(session.contactMethod)}`}
              />
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
                session.generalArea && <Row label={tx("Area")} value={tx(session.generalArea)} />
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
