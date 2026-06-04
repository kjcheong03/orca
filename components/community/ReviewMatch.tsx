"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, Info, X } from "lucide-react";
import { matchPartners, type MatchResult } from "@/lib/matching";
import { calculateTaskCost, costDetail, formatCostEstimate } from "@/lib/cost";
import { type ContactInfo } from "@/components/community/ContactDetails";
import {
  getOrganisation,
  saveRequestSession,
  supportTypeLabels,
  type CostEstimate,
  type ItemQuantity,
  type Organisation,
  type RequestSession,
  type SupportTypeId,
  type TaskState,
} from "@/lib/community";

type TaskEntry = [SupportTypeId, TaskState];
interface Selection {
  primaryId: string | null;
  fallbackIds: string[];
}

function summaryLine(type: SupportTypeId, d: Record<string, unknown>, generalArea: string): string {
  const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  let parts: string[] = [];
  if (type === "supplies") parts = [s("urgency"), s("deliveryOrPickup"), generalArea];
  else if (type === "food") {
    if (s("fulfilmentMethod")) {
      // Food pack / rations
      parts = [s("numberOfPacks"), s("neededBy"), s("fulfilmentMethod")];
    } else {
      const portions = s("portionsPerMeal");
      const meals = Array.isArray(d.mealsNeeded) ? (d.mealsNeeded as string[]).join(" + ") : "";
      parts = [portions ? `${portions} portions` : "", meals, s("duration"), "Delivery"];
    }
  }
  else if (type === "welfare") parts = [s("checkMethod"), s("preferredTime"), s("language")];
  else if (type === "transport")
    parts = [s("pickupArea"), s("mobilityNeeds"), d.wheelchairRequired ? "Wheelchair" : ""];
  else if (type === "referral") parts = [s("urgency"), s("language")];
  return parts.filter(Boolean).join(" · ");
}

function CostChip({ est }: { est: CostEstimate }) {
  const cls =
    "inline-flex items-center rounded-full bg-[#d6f3e0] px-2 py-0.5 text-[11px] font-semibold text-[#0f7a4a]";
  return <span className={cls}>{est.label ?? formatCostEstimate(est)}</span>;
}

/** A pills row: estimated cost first, then reason tags. */
function Pills({ est, reasons }: { est?: CostEstimate; reasons: string[] }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {est && <CostChip est={est} />}
      {reasons.map((r) => (
        <span key={r} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
          {r}
        </span>
      ))}
    </div>
  );
}

function Checkbox({ on }: { on: boolean }) {
  return (
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors ${
        on ? "border-brand bg-brand text-white" : "border-black/20"
      }`}
    >
      {on && <Check size={13} strokeWidth={3.5} />}
    </span>
  );
}

export default function ReviewMatch({
  tasks,
  careRecipientName,
  linkedTopic,
  contact,
  onSubmitted,
  onBack,
  onReset,
}: {
  tasks: TaskEntry[];
  careRecipientName: string;
  linkedTopic: string;
  contact: ContactInfo;
  onSubmitted: () => void;
  onBack: () => void;
  onReset: () => void;
}) {
  const drafts = useMemo(
    () =>
      tasks.map(([type, t]) => ({
        id: type,
        supportType: type,
        selectedSubtypes: t.subtypes,
        details: t.details,
      })),
    [tasks],
  );

  const matches = useMemo(() => {
    const m = {} as Record<SupportTypeId, MatchResult>;
    // The global general area drives matching unless a task carries its own.
    for (const d of drafts)
      m[d.supportType] = matchPartners({ ...d, details: { area: contact.generalArea, ...d.details } });
    return m;
  }, [drafts, contact.generalArea]);

  const [selections, setSelections] = useState<Record<string, Selection>>(() => {
    const s: Record<string, Selection> = {};
    for (const d of drafts) {
      const r = matches[d.supportType];
      const primaryId = r.primaryId;
      // Recommended fallbacks = suitable, non-primary partners.
      const fallbackIds = r.ranked
        .filter((m) => m.org.id !== primaryId && m.suitable)
        .map((m) => m.org.id);
      s[d.supportType] = { primaryId, fallbackIds };
    }
    return s;
  });

  const [changing, setChanging] = useState<SupportTypeId | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [submitted, setSubmitted] = useState<RequestSession | null>(null);

  const matchFor = (type: SupportTypeId, id: string | null) =>
    id ? matches[type].ranked.find((m) => m.org.id === id) : undefined;

  const setPrimary = (type: SupportTypeId, id: string) => {
    setSelections((prev) => ({
      ...prev,
      [type]: {
        primaryId: id,
        fallbackIds: prev[type].fallbackIds.filter((x) => x !== id), // can't be both
      },
    }));
    setChanging(null);
  };

  const toggleFallback = (type: SupportTypeId, id: string) =>
    setSelections((prev) => {
      const cur = prev[type];
      const fallbackIds = cur.fallbackIds.includes(id)
        ? cur.fallbackIds.filter((x) => x !== id)
        : [...cur.fallbackIds, id];
      return { ...prev, [type]: { ...cur, fallbackIds } };
    });

  const submit = () => {
    if (!acknowledged) return;
    const session: RequestSession = {
      id: `req-${Date.now()}`,
      careRecipientName,
      caregiverName: contact.caregiverName,
      contactNumber: contact.contactNumber,
      contactMethod: contact.contactMethod,
      email: contact.contactMethod === "Email" ? contact.email : undefined,
      relationship: contact.relationship || undefined,
      linkedTopic,
      createdAt: new Date().toISOString(),
      overallStatus: "Sent",
      tasks: drafts.map((d) => {
        const primaryOrg = getOrganisation(selections[d.supportType].primaryId ?? "");
        return {
          id: d.id,
          supportType: d.supportType,
          selectedSubtypes: d.selectedSubtypes,
          details: d.details,
          primaryOrganisationId: selections[d.supportType].primaryId ?? "",
          fallbackOrganisationIds: selections[d.supportType].fallbackIds,
          costEstimate: primaryOrg ? calculateTaskCost(d, primaryOrg) : undefined,
          status: "Sent" as const,
        };
      }),
    };
    saveRequestSession(session);
    setSubmitted(session);
    onSubmitted();
    window.scrollTo({ top: 0 });
  };

  // --- success state ---
  if (submitted) {
    const reqWord = submitted.tasks.length === 1 ? "request" : "requests";
    const partnerCount = new Set(submitted.tasks.map((t) => t.primaryOrganisationId)).size;
    const partnerWord = partnerCount === 1 ? "partner" : "partners";
    return (
      <div className="space-y-5">
        <div className="rounded-[24px] bg-card p-6 text-center shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e6f5ee] text-[#147a4f]">
            <Check size={28} strokeWidth={3} />
          </span>
          <h2 className="display mt-3 text-[20px] text-ink">Request sent</h2>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
            CARA has sent your {reqWord} to the selected {partnerWord}. They&apos;ll reach out via your
            chosen contact method.
          </p>
        </div>
        <div className="rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
          {submitted.tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-2 py-1.5 text-[14px]">
              <Check size={18} className="mt-0.5 shrink-0 text-[#1a8f5e]" strokeWidth={3} />
              <span className="text-body">
                <span className="font-semibold text-ink">{supportTypeLabels[t.supportType]}</span> →{" "}
                {getOrganisation(t.primaryOrganisationId)?.name}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm"
        >
          Start a new request
        </button>
      </div>
    );
  }

  const count = drafts.length;

  return (
    <div className="space-y-4">
      {drafts.map((d) => {
        const type = d.supportType;
        const sel = selections[type];
        const primary = matchFor(type, sel.primaryId);
        const primaryEst = primary ? calculateTaskCost(d, primary.org) : null;
        const fallbackOptions = matches[type].ranked.filter((m) => m.org.id !== sel.primaryId);
        return (
          <section key={type} className="rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
            {/* Header */}
            <p className="text-[15px] font-extrabold text-ink">{supportTypeLabels[type]}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(type === "supplies" && Array.isArray(d.details.itemsNeeded)
                ? (d.details.itemsNeeded as ItemQuantity[]).map((it) => {
                    const name = it.item === "Other item" && it.customItem ? it.customItem : it.item;
                    return it.quantity ? `${name} ×${it.quantity}` : name;
                  })
                : d.selectedSubtypes
              ).map((label) => (
                <span key={label} className="rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] font-semibold text-brand-dark">
                  {label}
                </span>
              ))}
            </div>
            {summaryLine(type, d.details, contact.generalArea) && (
              <p className="mt-1.5 text-[12.5px] text-muted">
                {summaryLine(type, d.details, contact.generalArea)}
              </p>
            )}

            {/* Primary */}
            <div className="mt-3 rounded-2xl bg-card p-3.5 ring-1 ring-brand/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-brand">Primary partner</span>
                <button type="button" onClick={() => setChanging(type)} className="text-[12.5px] font-semibold text-brand hover:underline">
                  Change
                </button>
              </div>
              {primary ? (
                <>
                  <p className="mt-1 text-[15px] font-bold text-ink">{primary.org.name}</p>
                  <p className="text-[12.5px] leading-snug text-muted">{primary.org.description}</p>
                  <Pills est={primaryEst ?? undefined} reasons={primary.reasons} />
                  {primaryEst && costDetail(primaryEst) && (
                    <p className="mt-1.5 text-[11.5px] text-faint">{costDetail(primaryEst)}</p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-[13px] text-faint">No suitable partner available</p>
              )}
            </div>

            {/* Fallbacks */}
            {fallbackOptions.length > 0 && (
              <>
                <div className="mt-4 flex items-center gap-1.5">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-faint">Fallback partners</p>
                  <button
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    aria-label="About fallback partners"
                    className="text-faint transition-colors hover:text-brand"
                  >
                    <Info size={15} />
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {fallbackOptions.map((m) => {
                    const on = sel.fallbackIds.includes(m.org.id);
                    return (
                      <button
                        key={m.org.id}
                        type="button"
                        onClick={() => toggleFallback(type, m.org.id)}
                        className={`flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors ${
                          on ? "bg-brand-soft/40 ring-1 ring-brand/30" : "bg-card ring-1 ring-black/10"
                        }`}
                      >
                        <span className="mt-0.5">
                          <Checkbox on={on} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-bold text-ink">{m.org.name}</span>
                          <Pills est={calculateTaskCost(d, m.org)} reasons={m.reasons} />
                          {!m.suitable && m.note && (
                            <span className="mt-1 block text-[11.5px] font-medium text-danger">{m.note}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        );
      })}

      {/* Bottom summary */}
      <div className="rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        <p className="text-[14px] font-bold text-ink">
          You&apos;re submitting {count} request{count === 1 ? "" : "s"}.
        </p>
        <ul className="mt-3 space-y-2.5">
          {drafts.map((d) => {
            const sel = selections[d.supportType];
            const primaryOrg = getOrganisation(sel.primaryId ?? "");
            const primaryName = primaryOrg?.name ?? "—";
            const est = primaryOrg ? calculateTaskCost(d, primaryOrg) : null;
            const fallbackNames = sel.fallbackIds
              .map((id) => getOrganisation(id)?.name)
              .filter(Boolean) as string[];
            return (
              <li key={d.id} className="flex items-start gap-2 text-[14px]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block text-body">
                    <span className="font-semibold text-ink">{supportTypeLabels[d.supportType]}</span> → {primaryName}{" "}
                    {est && <CostChip est={est} />}
                  </span>
                  <span className="block truncate text-[12px] text-faint">
                    Fallbacks: {fallbackNames.length ? fallbackNames.join(", ") : "none selected"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sharing acknowledgement — required before submitting */}
      <button
        type="button"
        onClick={() => setAcknowledged((v) => !v)}
        aria-pressed={acknowledged}
        className="flex w-full items-start gap-3 rounded-[22px] bg-card p-4 text-left shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
      >
        <span className="mt-0.5">
          <Checkbox on={acknowledged} />
        </span>
        <span className="text-[13.5px] leading-snug text-body">
          I understand CARA will share my contact and request details with the selected partners.
        </span>
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full px-4 py-3 text-[14px] font-semibold text-body hover:text-ink"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!acknowledged}
          className="flex-1 rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors disabled:bg-[#d5d9e1] disabled:text-[#6b7280] disabled:shadow-none"
        >
          Submit request
        </button>
      </div>

      {/* Fallback info modal */}
      {infoOpen && (
        <div className="fade-enter fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" onClick={() => setInfoOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="pop-enter relative w-full max-w-sm rounded-[24px] bg-card p-6">
            <p className="text-[15px] font-bold text-ink">Fallback partners</p>
            <p className="mt-2 text-[14px] leading-relaxed text-body">
              If the primary partner can&apos;t help, CARA can try these fallback partners.
            </p>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className="mt-4 w-full rounded-full bg-brand py-2.5 text-[14px] font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Change primary sheet */}
      {changing && (
        <ChangePrimarySheet
          matches={matches[changing]}
          subtypes={drafts.find((d) => d.supportType === changing)?.selectedSubtypes ?? []}
          details={drafts.find((d) => d.supportType === changing)?.details ?? {}}
          type={changing}
          selectedId={selections[changing].primaryId}
          onClose={() => setChanging(null)}
          onPick={(id) => setPrimary(changing, id)}
        />
      )}
    </div>
  );
}

function ChangePrimarySheet({
  matches,
  subtypes,
  details,
  type,
  selectedId,
  onClose,
  onPick,
}: {
  matches: MatchResult;
  subtypes: string[];
  details: Record<string, unknown>;
  type: SupportTypeId;
  selectedId: string | null;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const estFor = (org: Organisation) =>
    calculateTaskCost({ supportType: type, selectedSubtypes: subtypes, details }, org);
  return (
    <div className="fade-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="pop-enter relative flex max-h-[86dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-app sm:rounded-[28px]">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="display text-[18px] text-ink">Choose a primary partner</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm">
            <X size={18} className="text-ink" />
          </button>
        </div>
        <div className="no-scrollbar space-y-3 overflow-y-auto px-5 pb-8">
          {matches.ranked.map((m) => {
            const on = m.org.id === selectedId;
            return (
              <button
                key={m.org.id}
                type="button"
                onClick={() => onPick(m.org.id)}
                className={`block w-full rounded-[18px] bg-card p-4 text-left transition-shadow ${
                  on ? "bg-brand-soft/40 ring-1 ring-brand/30" : "ring-1 ring-black/[0.06] hover:shadow-[0_4px_16px_rgba(30,50,90,0.1)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-bold text-ink">{m.org.name}</p>
                  {on && <Check size={18} className="shrink-0 text-brand" strokeWidth={3} />}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{m.org.description}</p>
                <Pills est={estFor(m.org)} reasons={m.reasons} />
                {!m.suitable && m.note && <p className="mt-1.5 text-[12px] font-medium text-danger">{m.note}</p>}
                {m.org.limitations[0] && <p className="mt-1.5 text-[12px] text-faint">Note: {m.org.limitations[0]}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
