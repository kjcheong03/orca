"use client";

import { useEffect, useState } from "react";
import { WifiOff, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useOnline } from "@/lib/online";

/**
 * A small, persistent toast shown while the device is offline. It sits above the
 * bottom navigation (mobile) / bottom of the viewport (desktop) and under modals,
 * so it never blocks an in-progress flow. The caregiver can dismiss it with the
 * "×"; the dismissal is in-memory only, so it comes back on every reload and
 * whenever the connection drops again.
 */
export default function OfflineBanner() {
  const online = useOnline();
  const { tx } = useApp();
  const [dismissed, setDismissed] = useState(false);

  // Each time we go offline (again), clear a previous dismissal so a fresh
  // offline state always surfaces the banner.
  useEffect(() => {
    if (!online) setDismissed(false);
  }, [online]);

  if (online || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pop-enter fixed inset-x-0 bottom-16 z-30 flex justify-center px-4 lg:bottom-4"
    >
      <div className="flex items-center gap-2.5 rounded-full bg-[#3b4252] py-2.5 pl-4 pr-2 text-white shadow-[0_4px_20px_rgba(20,30,50,0.25)]">
        <WifiOff size={16} className="shrink-0" />
        <span className="text-[13px] font-semibold leading-tight">
          {tx("You're offline — emergency info and contacts still work.")}
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={tx("Dismiss")}
          className="-mr-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
