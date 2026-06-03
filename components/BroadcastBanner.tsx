"use client";

import { ChevronRight, Megaphone } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { bannerBroadcast } from "@/lib/data";

export default function BroadcastBanner() {
  const { openBroadcast } = useApp();
  return (
    <button
      type="button"
      onClick={openBroadcast}
      className="flex w-full items-center gap-4 rounded-[20px] bg-card p-3.5 text-left shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand">
        <Megaphone size={26} className="text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold text-ink">
          {bannerBroadcast.title}
        </span>
        <span className="block truncate text-[13px] text-muted">
          {bannerBroadcast.preview}
        </span>
      </span>
      <ChevronRight size={24} className="shrink-0 text-faint" />
    </button>
  );
}
