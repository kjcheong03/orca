"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Car, Compass, HandHeart, HeartHandshake, Package, UtensilsCrossed } from "lucide-react";
import Mascot from "@/components/Mascot";
import {
  getOrganisation,
  supportTypeLabels,
  type RequestSession,
  type RequestStatus,
  type RequestTaskSession,
} from "@/lib/community";
import { loadRequests } from "@/lib/requestStore";
import RequestDetailModal from "@/components/community/RequestDetailModal";

const SUPPORT_TYPES = [
  { label: "Supplies", Icon: Package },
  { label: "Meals", Icon: UtensilsCrossed },
  { label: "Welfare check", Icon: HeartHandshake },
  { label: "Transport", Icon: Car },
  { label: "Care referral", Icon: Compass },
] as const;

const STATUS_CLS: Record<RequestStatus, string> = {
  Pending: "bg-warn/20 text-[#8a5a00]",
  Accepted: "bg-[#d6f3e0] text-[#0f7a4a]",
  Rejected: "bg-danger-soft text-[#b42318]",
};

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
        STATUS_CLS[status] ?? STATUS_CLS.Pending
      }`}
    >
      {status}
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

function partnersFor(task: RequestTaskSession): string {
  if (task.fulfilmentRoutes?.length) {
    return [...new Set(task.fulfilmentRoutes.map((r) => r.routeName))].join(", ");
  }
  return getOrganisation(task.primaryOrganisationId)?.name ?? "—";
}

export default function CommunityHome({ onStart }: { onStart: () => void }) {
  const [requests, setRequests] = useState<RequestSession[]>([]);
  const [open, setOpen] = useState<{ session: RequestSession; task: RequestTaskSession } | null>(null);

  // localStorage is client-only — load after mount to avoid hydration mismatch.
  useEffect(() => setRequests(loadRequests()), []);

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-4 pb-28 pt-5 lg:pt-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="-my-2 shrink-0">
          <Mascot size={52} variant="calm" animated={false} />
        </span>
        <div className="min-w-0">
          <h1 className="text-[20px] font-extrabold leading-tight text-ink">Community Support</h1>
        </div>
      </div>

      {/* What you can request + primary CTA */}
      <div className="rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        <p className="text-[14px] font-bold leading-snug text-ink">
          Request for different types of support from our community partners.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-5">
          {SUPPORT_TYPES.map(({ label, Icon }) => (
            <div key={label} className="flex w-20 flex-col items-center gap-1.5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-app text-brand">
                <Icon size={20} strokeWidth={2.2} />
              </span>
              <span className="text-center text-[11.5px] font-semibold leading-tight text-ink">
                {label}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onStart}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm transition-transform active:scale-[0.99]"
        >
          <HandHeart size={18} strokeWidth={2.3} />
          Request help
        </button>
      </div>

      {/* Your requests */}
      <div>
        <p className="px-1 text-[12px] font-bold uppercase tracking-wider text-faint">Your requests</p>

        {requests.length === 0 ? (
          <div className="mt-2 rounded-[20px] bg-card px-4 py-5 text-center shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
            <p className="text-[14px] font-semibold text-ink">No active requests</p>
            <p className="mt-0.5 text-[12.5px] text-muted">Requests you submit will appear here.</p>
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            {requests.flatMap((req) =>
              req.tasks.map((t) => (
                <button
                  key={`${req.id}-${t.id}`}
                  type="button"
                  onClick={() => setOpen({ session: req, task: t })}
                  className="block w-full rounded-[22px] bg-card p-4 text-left shadow-[0_2px_14px_rgba(30,50,90,0.06)] transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-ink">{supportTypeLabels[t.supportType]}</p>
                      <p className="mt-0.5 text-[12.5px] text-muted">{partnersFor(t)}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="mt-2 text-right text-[12px] text-faint">{formatWhen(req.createdAt)}</p>
                </button>
              )),
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
