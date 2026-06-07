"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Car, ChevronLeft, ChevronRight, Compass, HandHeart, HeartHandshake, Package, RefreshCw, UtensilsCrossed } from "lucide-react";
import Mascot from "@/components/Mascot";
import { useApp } from "@/context/AppContext";
import { useOnline } from "@/lib/online";
import { readCache, saveCache } from "@/lib/offlineCache";
import { QUEUE_CHANGED_EVENT, queuedRequests } from "@/lib/requestQueue";
import {
  getOrganisation,
  supportTypeLabels,
  type RequestSession,
  type RequestStatus,
  type RequestTaskSession,
  type SupportTypeId,
} from "@/lib/community";
import {
  isRouteBased,
  isTerminalStatus,
  requestRef,
  routeStatus,
  routeStatusLabel,
  taskStatus,
  taskStatusLabel,
} from "@/lib/contract";
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

function StatusBadge({ status, label }: { status: RequestStatus; label?: string }) {
  const { tx } = useApp();
  // `status` (raw lifecycle) sets the colour; `label` (optional checkpoint) sets the text.
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
        STATUS_CLS[status] ?? STATUS_CLS.Pending
      }`}
    >
      {tx(label ?? status)}
    </span>
  );
}

/**
 * The category-header badge. Route-based tasks (food + supplies) carry their state on
 * per-route pills, so they get no category-level badge. Partner-assigned tasks show theirs.
 */
function TaskHeaderBadge({ task }: { task: RequestTaskSession }) {
  if (isRouteBased(task) && task.fulfilmentRoutes?.length) return null; // per-route pills
  return <StatusBadge status={taskStatus(task)} label={taskStatusLabel(task)} />; // partner-assigned
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
  const online = useOnline();
  const [requests, setRequests] = useState<RequestSession[]>([]);
  // Requests submitted offline, waiting in the local outbox to be sent.
  const [queued, setQueued] = useState<RequestSession[]>([]);
  const [open, setOpen] = useState<{ session: RequestSession; task: RequestTaskSession } | null>(null);

  const [tab, setTab] = useState<"open" | "closed">("open");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stale, setStale] = useState(false); // showing a cached list (offline)
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueued = useCallback(() => {
    queuedRequests().then(setQueued).catch(() => {});
  }, []);

  // Load the request log from Supabase (via the server route) after mount. `loading`
  // drives the ghost-card skeleton — we keep showing it for the whole load (however long)
  // and only ever render the empty state once a load genuinely succeeds with no rows. A
  // failed load offline falls back to the last-known cached list; a failed load with no
  // cache shows a retry, never a misleading "no requests".
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    loadQueued();
    loadRequests()
      .then((r) => {
        if (!active) return;
        setRequests(r);
        saveCache("requests", r); // keep a copy to view offline
        setStale(false);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        const cached = readCache<RequestSession[]>("requests");
        if (cached?.data) {
          setRequests(cached.data);
          setStale(true);
          setError(false);
        } else {
          setError(true);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey, loadQueued]);

  // In-place refresh: re-fetch without the full skeleton (the list stays, the icon
  // spins). A ref guard (not the `refreshing` state) keeps this callback stable, so
  // the effects below don't re-fire — and loop — when `refreshing` toggles. A
  // mounted ref drops any state write that resolves after the user leaves the tab.
  const refreshingRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const reloadServer = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    loadQueued();
    loadRequests()
      .then((r) => {
        if (!mountedRef.current) return;
        setRequests(r);
        saveCache("requests", r);
        setStale(false);
      })
      .catch(() => {})
      .finally(() => {
        refreshingRef.current = false;
        if (mountedRef.current) setRefreshing(false);
      });
  }, [loadQueued]);

  // Refresh when the outbox changes: a new offline submission shows up right away,
  // and once the shell flushes the queue on reconnect, the sent server copies
  // replace the local "waiting to send" ones. (reloadServer also reloads the queue.)
  useEffect(() => {
    const onChange = () => reloadServer();
    window.addEventListener(QUEUE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(QUEUE_CHANGED_EVENT, onChange);
  }, [reloadServer]);

  // Refresh the list when the connection returns. The always-mounted shell owns
  // the outbox flush (and flushQueue fires QUEUE_CHANGED for anything it sends);
  // here we just re-pull the server list. Skip the initial mount to avoid a
  // double fetch alongside the load effect above.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (online) reloadServer();
  }, [online, reloadServer]);

  // Merge the offline outbox in front of the server list. A queued request that
  // already exists on the server (just flushed) is dropped in favour of the
  // server copy, so it never shows twice.
  const serverIds = new Set(requests.map((r) => r.id));
  const pendingOffline = queued.filter((q) => !serverIds.has(q.id));
  const offlineIds = new Set(pendingOffline.map((r) => r.id));
  const allRequests = [...pendingOffline, ...requests];

  // Flatten to per-task cards (newest sessions first from the API), then split by
  // lifecycle so open requests are easy to find. A card is "closed" once its effective
  // status is terminal (Completed / Rejected / Cancelled).
  const cards = allRequests.flatMap((req) => req.tasks.map((t) => ({ req, t })));
  const openCards = cards.filter(({ t }) => !isTerminalStatus(taskStatus(t)));
  const closedCards = cards.filter(({ t }) => isTerminalStatus(taskStatus(t)));
  const shown = tab === "open" ? openCards : closedCards;

  // Paginate the active tab — up to PAGE_SIZE per page, with controls only when
  // there's more than one page. `safePage` clamps in case the list shrank under us.
  const PAGE_SIZE = 5;
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

      {/* Requests — one encompassing card; the list scrolls inside it while the control
          row (tabs + pager) stays pinned. Labelled for screen readers since the visible
          "Your requests" heading is gone. */}
      <section className="flex flex-col rounded-[22px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        <div className="flex shrink-0 items-center justify-between gap-2 px-1 pb-2.5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-faint">
            {tx("Your requests")}
          </p>
          {stale && (
            <span className="text-[11px] font-medium text-faint">{tx("Offline · saved copy")}</span>
          )}
        </div>

        {/* Control row — Open/Closed on the left; compact pager on the right (>1 page) */}
        {!loading && allRequests.length > 0 && (
          <div className="flex shrink-0 items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1">
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
              <button
                type="button"
                onClick={reloadServer}
                disabled={refreshing}
                aria-label={tx("Refresh")}
                title={tx("Refresh")}
                className="grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:text-ink disabled:opacity-50"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  aria-label={tx("Previous page")}
                  className="grid h-8 w-8 place-items-center rounded-full text-ink transition-transform active:scale-90 disabled:opacity-30"
                >
                  <ChevronLeft size={18} strokeWidth={2.4} />
                </button>
                <span className="text-[12.5px] font-semibold tabular-nums text-muted">
                  {safePage + 1}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  aria-label={tx("Next page")}
                  className="grid h-8 w-8 place-items-center rounded-full text-ink transition-transform active:scale-90 disabled:opacity-30"
                >
                  <ChevronRight size={18} strokeWidth={2.4} />
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="mt-2.5 space-y-2.5 px-1 py-1">
            <div className="animate-pulse space-y-2.5">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : error && allRequests.length === 0 ? (
          <div className="fade-enter flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
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
        ) : allRequests.length === 0 ? (
          <div className="fade-enter flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
            <p className="text-[14px] font-semibold text-ink">{tx("No active requests")}</p>
            <p className="mt-0.5 text-[12.5px] text-muted">{tx("Requests you submit will appear here.")}</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="fade-enter flex min-h-[160px] flex-col items-center justify-center px-4 text-center">
            <p className="text-[13px] text-muted">
              {tx(tab === "open" ? "No open requests." : "No closed requests.")}
            </p>
          </div>
        ) : (
          <div className="fade-enter mt-2.5 space-y-2.5 px-1 py-1">
                {paged.map(({ req, t }) => (
                  <button
                    key={`${req.id}-${t.id}`}
                    type="button"
                    onClick={() => setOpen({ session: req, task: t })}
                    className="block w-full rounded-2xl bg-card p-4 text-left ring-1 ring-black/10 transition-transform active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-bold text-ink">{tx(supportTypeLabels[t.supportType])}</p>
                      {offlineIds.has(req.id) ? (
                        <span className="shrink-0 rounded-full bg-warn/20 px-2.5 py-1 text-[11.5px] font-semibold text-[#8a5a00]">
                          {tx("Waiting to send")}
                        </span>
                      ) : (
                        <TaskHeaderBadge task={t} />
                      )}
                    </div>
                    {isRouteBased(t) && t.fulfilmentRoutes?.length ? (
                      <div className="mt-1.5 space-y-1">
                        {t.fulfilmentRoutes.map((r) => (
                          <div key={r.label} className="flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-[12.5px] text-muted">
                              <span className="font-medium text-ink">{tx(r.label)}</span> → {r.routeName}
                            </span>
                            <StatusBadge status={routeStatus(r)} label={routeStatusLabel(r)} />
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
        )}
      </section>

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
