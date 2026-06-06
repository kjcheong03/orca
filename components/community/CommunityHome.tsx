"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Car, ChevronLeft, ChevronRight, Compass, HandHeart, HeartHandshake, Package, UtensilsCrossed } from "lucide-react";
import Mascot from "@/components/Mascot";
import { useApp } from "@/context/AppContext";
import {
  getOrganisation,
  supportTypeLabels,
  type RequestSession,
  type RequestStatus,
  type RequestTaskSession,
  type SupportTypeId,
} from "@/lib/community";
import { isRouteBased, isTerminalStatus, requestRef, taskStatus } from "@/lib/contract";
import { loadRequests } from "@/lib/requestStore";
import RequestDetailModal from "@/components/community/RequestDetailModal";
import SegmentedToggle from "@/components/ui/SegmentedToggle";

const SUPPORT_TYPES = [
  { id: "supplies", label: "Supplies", Icon: Package },
  { id: "food", label: "Meals", Icon: UtensilsCrossed },
  { id: "welfare", label: "Welfare check", Icon: HeartHandshake },
  { id: "transport", label: "Transport", Icon: Car },
  { id: "referral", label: "Care referral", Icon: Compass },
] as const;

const STATUS_CLS: Record<RequestStatus, string> = {
  Pending: "bg-warn/20 text-[#8a5a00]",
  Accepted: "bg-brand-soft text-brand-dark",
  "In progress": "bg-[#dbeafe] text-[#1e40af]",
  Completed: "bg-[#d6f3e0] text-[#0f7a4a]",
  Rejected: "bg-danger-soft text-[#b42318]",
  Cancelled: "bg-black/[0.06] text-faint",
};

function StatusBadge({ status }: { status: RequestStatus }) {
  const { tx } = useApp();
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
        STATUS_CLS[status] ?? STATUS_CLS.Pending
      }`}
    >
      {tx(status)}
    </span>
  );
}

/**
 * The category-header badge. Route-based tasks (food + supplies) carry their state on
 * per-route pills, so they get no category-level badge. Partner-assigned tasks show theirs.
 */
function TaskHeaderBadge({ task }: { task: RequestTaskSession }) {
  if (isRouteBased(task) && task.fulfilmentRoutes?.length) return null; // per-route pills
  return <StatusBadge status={taskStatus(task)} />; // partner-assigned
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

/** Ghost placeholder mirroring a request tile, shown while the request log loads. */
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-black/10">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3.5 w-32 rounded-full bg-black/10" />
        <div className="h-5 w-16 rounded-full bg-black/10" />
      </div>
      <div className="mt-3 h-3 w-44 rounded-full bg-black/[0.08]" />
      <div className="mt-3 flex items-center justify-between">
        <div className="h-2.5 w-20 rounded-full bg-black/[0.06]" />
        <div className="h-2.5 w-28 rounded-full bg-black/[0.06]" />
      </div>
    </div>
  );
}

function partnersFor(task: RequestTaskSession): string {
  if (task.fulfilmentRoutes?.length) {
    return [...new Set(task.fulfilmentRoutes.map((r) => r.routeName))].join(", ");
  }
  return getOrganisation(task.primaryOrganisationId)?.name ?? "—";
}

export default function CommunityHome({ onStart }: { onStart: (type?: SupportTypeId) => void }) {
  const { tx } = useApp();
  const [requests, setRequests] = useState<RequestSession[]>([]);
  const [open, setOpen] = useState<{ session: RequestSession; task: RequestTaskSession } | null>(null);

  const [tab, setTab] = useState<"open" | "closed">("open");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Load the request log from Supabase (via the server route) after mount. `loading`
  // drives the ghost-card skeleton — we keep showing it for the whole load (however long)
  // and only ever render the empty state once a load genuinely succeeds with no rows. A
  // failed load shows a retry, never a misleading "no requests".
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    loadRequests()
      .then((r) => {
        if (!active) return;
        setRequests(r);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Flatten to per-task cards (newest sessions first from the API), then split by
  // lifecycle so open requests are easy to find. A card is "closed" once its effective
  // status is terminal (Completed / Rejected / Cancelled).
  const cards = requests.flatMap((req) => req.tasks.map((t) => ({ req, t })));
  const openCards = cards.filter(({ t }) => !isTerminalStatus(taskStatus(t)));
  const closedCards = cards.filter(({ t }) => isTerminalStatus(taskStatus(t)));
  const shown = tab === "open" ? openCards : closedCards;

  // Paginate the active tab — up to PAGE_SIZE per page, with controls only when
  // there's more than one page. `safePage` clamps in case the list shrank under us.
  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = shown.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5rem-env(safe-area-inset-bottom))] w-full max-w-xl flex-col gap-5 px-4 pt-5 lg:min-h-[calc(100dvh-3.5rem)] lg:pt-8">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3">
        <span className="-my-2 shrink-0">
          <Mascot size={52} variant="calm" animated={false} />
        </span>
        <div className="min-w-0">
          <h1 className="text-[20px] font-extrabold leading-tight text-ink">{tx("Community Support")}</h1>
        </div>
      </div>

      {/* What you can request + primary CTA */}
      <div className="shrink-0 rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        <p className="text-[14px] font-bold leading-snug text-ink">
          {tx("Request for different types of support from our community partners.")}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-5">
          {SUPPORT_TYPES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onStart(id)}
              className="flex w-20 flex-col items-center gap-1.5 rounded-xl transition-transform active:scale-95"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-app text-brand">
                <Icon size={20} strokeWidth={2.2} />
              </span>
              <span className="text-center text-[11.5px] font-semibold leading-tight text-ink">
                {tx(label)}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onStart()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm transition-transform active:scale-[0.99]"
        >
          <HandHeart size={18} strokeWidth={2.3} />
          {tx("Request help")}
        </button>
      </div>

      {/* Your requests — one encompassing card; the list scrolls inside it. The card
          flex-fills the remaining height and stops just above the nav (gap below). */}
      <div className="flex min-h-[460px] flex-col rounded-[22px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        {/* Title + small B&W Open/Closed toggle on the same row */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-1">
          <p className="text-[12px] font-bold uppercase tracking-wider text-faint">{tx("Your requests")}</p>
          {requests.length > 0 && (
            <SegmentedToggle<"open" | "closed">
              size="sm"
              fluid={false}
              bare
              value={tab}
              onChange={(v) => {
                setTab(v);
                setPage(0);
              }}
              options={[
                { value: "open", label: tx("Open") },
                { value: "closed", label: tx("Closed") },
              ]}
            />
          )}
        </div>

        {loading ? (
          <div className="mt-2.5 min-h-0 flex-1 space-y-2.5 overflow-hidden px-1 py-1">
            <div className="animate-pulse space-y-2.5">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : error ? (
          <div className="fade-enter flex flex-1 flex-col items-center justify-center px-4 text-center">
            <p className="text-[14px] font-semibold text-ink">{tx("Couldn't load your requests")}</p>
            <p className="mt-0.5 text-[12.5px] text-muted">{tx("Please check your connection and try again.")}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-transform active:scale-95"
            >
              {tx("Try again")}
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="fade-enter flex flex-1 flex-col items-center justify-center px-4 text-center">
            <p className="text-[14px] font-semibold text-ink">{tx("No active requests")}</p>
            <p className="mt-0.5 text-[12.5px] text-muted">{tx("Requests you submit will appear here.")}</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="fade-enter flex flex-1 flex-col items-center justify-center px-4 text-center">
            <p className="text-[13px] text-muted">
              {tx(tab === "open" ? "No open requests." : "No closed requests.")}
            </p>
          </div>
        ) : (
          <div className="mt-2.5 flex min-h-0 flex-1 flex-col">
            <div className="fade-enter flex-1 space-y-2.5 px-1 py-1">
                {paged.map(({ req, t }) => (
                  <button
                    key={`${req.id}-${t.id}`}
                    type="button"
                    onClick={() => setOpen({ session: req, task: t })}
                    className="block w-full rounded-2xl bg-card p-4 text-left ring-1 ring-black/10 transition-transform active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-bold text-ink">{tx(supportTypeLabels[t.supportType])}</p>
                      <TaskHeaderBadge task={t} />
                    </div>
                    {isRouteBased(t) && t.fulfilmentRoutes?.length ? (
                      <div className="mt-1.5 space-y-1">
                        {t.fulfilmentRoutes.map((r) => (
                          <div key={r.label} className="flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-[12.5px] text-muted">
                              <span className="font-medium text-ink">{tx(r.label)}</span> → {r.routeName}
                            </span>
                            <StatusBadge status={r.lifecycle ?? "Pending"} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-0.5 text-[12.5px] text-muted">{partnersFor(t)}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-faint">
                      <span>{requestRef(req.id)}</span>
                      <span>{formatWhen(req.createdAt)}</span>
                    </div>
                  </button>
                ))}
            </div>

            {/* Pager — only shown when the active tab spills past one page. */}
            {totalPages > 1 && (
              <div className="mt-2 flex shrink-0 items-center justify-between px-1">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-black/10 text-ink transition-transform active:scale-95 disabled:opacity-35"
                  aria-label={tx("Previous page")}
                >
                  <ChevronLeft size={18} strokeWidth={2.4} />
                </button>
                <span className="text-[12.5px] font-semibold text-muted">
                  {tx("Page")} {safePage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-black/10 text-ink transition-transform active:scale-95 disabled:opacity-35"
                  aria-label={tx("Next page")}
                >
                  <ChevronRight size={18} strokeWidth={2.4} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <RequestDetailModal
            key="req-modal"
            session={open.session}
            task={open.task}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
