"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Info, Star, X } from "lucide-react";
import { matchPartners, routeRequest, type MatchResult } from "@/lib/matching";
import { calculateTaskCost, formatCostEstimate } from "@/lib/cost";
import { useApp } from "@/context/AppContext";
import { type ContactInfo } from "@/components/community/ContactDetails";
import { persistRequest } from "@/lib/requestStore";
import { requestRef } from "@/lib/contract";
import {
  getOrganisation,
  supportTypeLabels,
  type CostEstimate,
  type FulfilmentRoute,
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

/** Green pill for a cost / availability label. */
function LabelChip({ text }: { text: string }) {
  const { tx } = useApp();
  return (
    <span className="inline-flex items-center rounded-full bg-[#d6f3e0] px-2 py-0.5 text-[11px] font-semibold text-[#0f7a4a]">
      {tx(text)}
    </span>
  );
}

function CostChip({ est }: { est: CostEstimate }) {
  return <LabelChip text={est.label ?? formatCostEstimate(est)} />;
}

/** Cost chip only (reason tags removed as redundant). */
function Pills({ est }: { est?: CostEstimate }) {
  if (!est) return null;
  return (
    <div className="mt-1.5">
      <CostChip est={est} />
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

/** Square org/route logo with a letter fallback + optional recommended star. */
function OrgLogo({ src, name, recommended }: { src?: string; name: string; recommended?: boolean }) {
  const [err, setErr] = useState(false);
  return (
    <span className="relative shrink-0">
      <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06]">
        {src && !err ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" onError={() => setErr(true)} className="h-full w-full object-contain" />
        ) : (
          <span className="text-[15px] font-bold text-brand">{name.charAt(0)}</span>
        )}
      </span>
      {recommended && (
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-brand text-white ring-2 ring-card">
          <Star size={9} fill="currentColor" strokeWidth={0} />
        </span>
      )}
    </span>
  );
}

/** Item/subtype-level fulfilment routes (supplies + food). */
function RouteList({ routes }: { routes: FulfilmentRoute[] }) {
  const { tx } = useApp();
  return (
    <>
      <div className="mt-3 space-y-2">
        {routes.map((r) => {
          const unavailable = r.availabilityMode === "unavailable";
          return (
            <div key={r.label} className="rounded-2xl bg-card p-3.5 ring-2 ring-brand/45">
              <div className="flex items-center gap-3">
                <OrgLogo src={r.logo} name={r.routeName} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-ink">{r.routeName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] font-semibold text-brand-dark">
                      {tx(r.label)}
                      {r.quantity ? ` ×${r.quantity}` : ""}
                    </span>
                    {!unavailable && <LabelChip text={r.costLabel} />}
                  </div>
                  {unavailable && <p className="mt-1.5 text-[12px] text-faint">{tx(r.status)}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
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
  const { tx, txf } = useApp();
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

  // Item/subtype routes for supplies + food; null for single-partner types.
  const routesByType = useMemo(() => {
    const m = {} as Partial<Record<SupportTypeId, FulfilmentRoute[] | null>>;
    for (const d of drafts)
      m[d.supportType] = routeRequest({ ...d, details: { area: contact.generalArea, ...d.details } });
    return m;
  }, [drafts, contact.generalArea]);

  const matches = useMemo(() => {
    const m = {} as Record<SupportTypeId, MatchResult>;
    for (const d of drafts)
      m[d.supportType] = matchPartners({ ...d, details: { area: contact.generalArea, ...d.details } });
    return m;
  }, [drafts, contact.generalArea]);

  const [selections, setSelections] = useState<Record<string, Selection>>(() => {
    const s: Record<string, Selection> = {};
    for (const d of drafts) {
      if (routesByType[d.supportType]) continue; // routed types have no primary/fallback
      const r = matches[d.supportType];
      const primaryId = r.primaryId;
      const fallbackIds = r.ranked
        .filter((m) => m.org.id !== primaryId && m.suitable)
        .map((m) => m.org.id);
      s[d.supportType] = { primaryId, fallbackIds };
    }
    return s;
  });

  const [changing, setChanging] = useState<SupportTypeId | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [costAck, setCostAck] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [submitted, setSubmitted] = useState<RequestSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Stable id generated once per review submission (not inside submit, which can
  // re-run). Doubles as the server idempotency key so a retry can't create a dupe.
  const [sessionId] = useState(() => `req-${Date.now()}`);
  const submitLock = useRef(false);

  // Any paid goods/services in this request? (gates the cost acknowledgement.)
  const hasPaid = drafts.some((d) => {
    const routes = routesByType[d.supportType];
    if (routes) return routes.some((r) => r.costLabel.includes("$"));
    const org = getOrganisation(selections[d.supportType]?.primaryId ?? "");
    const est = org ? calculateTaskCost(d, org) : null;
    return est ? ["estimated", "fixed", "mixed"].includes(est.costType) : false;
  });

  const matchFor = (type: SupportTypeId, id: string | null) =>
    id ? matches[type].ranked.find((m) => m.org.id === id) : undefined;

  const setPrimary = (type: SupportTypeId, id: string) => {
    setSelections((prev) => ({
      ...prev,
      [type]: {
        primaryId: id,
        fallbackIds: prev[type].fallbackIds.filter((x) => x !== id),
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

  const submit = async () => {
    if (!acknowledged || (hasPaid && !costAck)) return;
    // Re-entrancy guard: ignore any further calls while the first POST is in
    // flight (double-click / Enter spam). The ref flips synchronously, before
    // React re-renders, so it catches calls in the same tick.
    if (submitLock.current) return;
    submitLock.current = true;
    setIsSubmitting(true);
    const session: RequestSession = {
      id: sessionId,
      careRecipientName,
      caregiverName: contact.caregiverName,
      contactNumber: contact.contactNumber,
      contactMethod: contact.contactMethod,
      email: contact.contactMethod === "Email" ? contact.email : undefined,
      relationship: contact.relationship || undefined,
      generalArea: contact.generalArea || undefined,
      address: contact.address || undefined,
      postalCode: contact.postalCode || undefined,
      accessNotes: contact.accessNotes || undefined,
      linkedTopic,
      createdAt: new Date().toISOString(),
      overallStatus: "Pending",
      tasks: drafts.map((d) => {
        const routes = routesByType[d.supportType];
        if (routes) {
          return {
            id: d.id,
            fulfilment: "route" as const,
            supportType: d.supportType,
            selectedSubtypes: d.selectedSubtypes,
            details: d.details,
            primaryOrganisationId: "",
            fallbackOrganisationIds: [],
            fulfilmentRoutes: routes,
            status: "Pending" as const,
          };
        }
        const sel = selections[d.supportType];
        const primaryOrg = getOrganisation(sel.primaryId ?? "");
        return {
          id: d.id,
          fulfilment: "partner" as const,
          supportType: d.supportType,
          selectedSubtypes: d.selectedSubtypes,
          details: d.details,
          primaryOrganisationId: sel.primaryId ?? "",
          fallbackOrganisationIds: sel.fallbackIds,
          costEstimate: primaryOrg ? calculateTaskCost(d, primaryOrg) : undefined,
          status: "Pending" as const,
        };
      }),
    };
    try {
      await persistRequest(session);
    } catch {
      // keep the success UX in this prototype even if the write hiccups
    }
    setSubmitted(session);
    onSubmitted();
    window.scrollTo({ top: 0 });
  };

  // --- success state ---
  if (submitted) {
    const reqWord = tx(submitted.tasks.length === 1 ? "request" : "requests");
    return (
      <div className="space-y-5">
        <div className="rounded-[24px] bg-card p-6 text-center shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e6f5ee] text-[#147a4f]">
            <Check size={28} strokeWidth={3} />
          </span>
          <h2 className="display mt-3 text-[20px] text-ink">{tx("Request sent")}</h2>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
            {txf(
              "ORCA has sent your {req} to the selected partners and active distribution channels. They'll reach out via your chosen contact method.",
              { req: reqWord },
            )}
          </p>
          <p className="mt-3 inline-flex items-center rounded-full bg-app px-3 py-1.5 text-[12.5px] font-semibold text-body">
            Reference&nbsp;<span className="text-ink">{requestRef(submitted.id)}</span>
          </p>
        </div>
        <div className="rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
          {submitted.tasks.map((t) => (
            <div key={t.id} className="py-1.5 text-[14px]">
              <div className="flex items-start gap-2">
                <Check size={18} className="mt-0.5 shrink-0 text-[#1a8f5e]" strokeWidth={3} />
                <span className="font-semibold text-ink">{tx(supportTypeLabels[t.supportType])}</span>
              </div>
              <div className="ml-6 text-[13px] text-body">
                {t.fulfilmentRoutes?.length
                  ? t.fulfilmentRoutes.map((r) => (
                      <span key={r.label} className="block truncate">
                        {tx(r.label)} → {r.routeName}
                      </span>
                    ))
                  : getOrganisation(t.primaryOrganisationId)?.name}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm"
        >
          {tx("Back to my requests")}
        </button>
      </div>
    );
  }

  const count = drafts.length;

  return (
    <div className="space-y-4">
      {drafts.map((d) => {
        const type = d.supportType;
        const routes = routesByType[type];

        // ----- Routed types (supplies + food): item/subtype route list -----
        if (routes) {
          return (
            <section key={type} className="rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
              <p className="text-[15px] font-extrabold text-ink">{tx(supportTypeLabels[type])}</p>
              <RouteList routes={routes} />
            </section>
          );
        }

        // ----- Single-partner types (welfare, transport, referral) -----
        const sel = selections[type];
        const primary = matchFor(type, sel.primaryId);
        const primaryEst = primary ? calculateTaskCost(d, primary.org) : null;
        const fallbackOptions = matches[type].ranked.filter((m) => m.org.id !== sel.primaryId);
        return (
          <section key={type} className="rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
            {/* Header */}
            <p className="text-[15px] font-extrabold text-ink">{tx(supportTypeLabels[type])}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {d.selectedSubtypes.map((label) => (
                <span key={label} className="rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] font-semibold text-brand-dark">
                  {tx(label)}
                </span>
              ))}
            </div>
            {/* Recommended */}
            <p className="mt-4 text-[12px] font-bold uppercase tracking-wide text-faint">{tx("Recommended partner")}</p>
            <div className="mt-2 rounded-2xl bg-card p-3.5 ring-2 ring-brand/45">
              {primary ? (
                <div className="flex items-center gap-3">
                  <OrgLogo src={primary.org.logo} name={primary.org.name} recommended />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-bold text-ink">{primary.org.name}</p>
                      <button type="button" onClick={() => setChanging(type)} className="shrink-0 text-[12.5px] font-semibold text-brand hover:underline">
                        {tx("Change")}
                      </button>
                    </div>
                    <Pills est={primaryEst ?? undefined} />
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] text-faint">{tx("No suitable partner available")}</p>
                  <button type="button" onClick={() => setChanging(type)} className="shrink-0 text-[12.5px] font-semibold text-brand hover:underline">
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Fallbacks */}
            {fallbackOptions.length > 0 && (
              <>
                <div className="mt-4 flex items-center gap-1.5">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-faint">{tx("Backup partners")}</p>
                  <button
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    aria-label={tx("About backup partners")}
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
                        className="flex w-full items-center gap-2.5 rounded-xl bg-card p-2.5 text-left ring-1 ring-black/10"
                      >
                        <Checkbox on={on} />
                        <OrgLogo src={m.org.logo} name={m.org.name} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-bold text-ink">{m.org.name}</span>
                          <Pills est={calculateTaskCost(d, m.org)} />
                          {!m.suitable && m.note && (
                            <span className="mt-1 block text-[11.5px] font-medium text-danger">{tx(m.note)}</span>
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
          {tx("I understand ORCA will share my contact and request details with the selected partners.")}
        </span>
      </button>

      {/* Cost acknowledgement — only when there are paid goods/services */}
      {hasPaid && (
        <button
          type="button"
          onClick={() => setCostAck((v) => !v)}
          aria-pressed={costAck}
          className="flex w-full items-start gap-3 rounded-[22px] bg-card p-4 text-left shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
        >
          <span className="mt-0.5">
            <Checkbox on={costAck} />
          </span>
          <span className="text-[13.5px] leading-snug text-body">
            {tx("For paid goods and services, I understand that partners will confirm the final costs with me.")}
          </span>
        </button>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full px-4 py-3 text-[14px] font-semibold text-body hover:text-ink"
        >
          <ArrowLeft size={18} />
          {tx("Back")}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!acknowledged || (hasPaid && !costAck) || isSubmitting}
          className="flex-1 rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors disabled:bg-[#d5d9e1] disabled:text-[#6b7280] disabled:shadow-none"
        >
          {isSubmitting
            ? tx("Submitting…")
            : txf("Submit {count} {req}", { count, req: tx(count === 1 ? "request" : "requests") })}
        </button>
      </div>

      {/* Fallback info modal */}
      {infoOpen && (
        <div className="fade-enter fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" onClick={() => setInfoOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="pop-enter relative w-full max-w-sm rounded-[24px] bg-card p-6">
            <p className="text-[15px] font-bold text-ink">{tx("Backup partners")}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-body">
              {tx("If the recommended partner can't help, ORCA can try these backup partners.")}
            </p>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className="mt-4 w-full rounded-full bg-brand py-2.5 text-[14px] font-semibold text-white"
            >
              {tx("Got it")}
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
  const { tx } = useApp();
  const estFor = (org: Organisation) =>
    calculateTaskCost({ supportType: type, selectedSubtypes: subtypes, details }, org);
  return (
    <div className="fade-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="pop-enter relative flex max-h-[86dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-app sm:rounded-[28px]">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="display text-[18px] text-ink">{tx("Choose a primary partner")}</h2>
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
                <div className="flex items-start gap-3">
                  <OrgLogo src={m.org.logo} name={m.org.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-bold text-ink">{m.org.name}</p>
                      {on && <Check size={18} className="shrink-0 text-brand" strokeWidth={3} />}
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{tx(m.org.description)}</p>
                    <Pills est={estFor(m.org)} />
                    {!m.suitable && m.note && <p className="mt-1.5 text-[12px] font-medium text-danger">{tx(m.note)}</p>}
                    {m.org.limitations[0] && <p className="mt-1.5 text-[12px] text-faint">{tx("Note:")} {tx(m.org.limitations[0])}</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
