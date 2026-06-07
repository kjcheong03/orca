"use client";

import { WifiOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useOnline } from "@/lib/online";

/**
 * A small, persistent toast shown only while the device is offline. It sits
 * above the bottom navigation (mobile) / bottom of the viewport (desktop) and
 * under modals, so it never blocks an in-progress flow. The copy reassures the
 * caregiver that the emergency essentials still work without a connection.
 */
export default function OfflineBanner() {
  const online = useOnline();
  const { tx } = useApp();

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pop-enter fixed inset-x-0 bottom-16 z-30 flex justify-center px-4 lg:bottom-4"
    >
      <div className="flex items-center gap-2.5 rounded-full bg-[#3b4252] px-4 py-2.5 text-white shadow-[0_4px_20px_rgba(20,30,50,0.25)]">
        <WifiOff size={16} className="shrink-0" />
        <span className="text-[13px] font-semibold leading-tight">
          {tx("You're offline — emergency info and contacts still work.")}
        </span>
      </div>
    </div>
  );
}
