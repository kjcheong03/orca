"use client";

import { useEffect, useRef } from "react";
import { Megaphone, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { broadcasts } from "@/lib/data";

export default function BroadcastSheet() {
  const { broadcastOpen, closeBroadcast, t } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!broadcastOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBroadcast();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [broadcastOpen, closeBroadcast]);

  if (!broadcastOpen) return null;

  return (
    <div
      className="fade-enter fixed inset-0 z-40 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="broadcast-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={closeBroadcast}
        className="absolute inset-0 bg-black/40"
      />
      <div className="sheet-enter relative flex max-h-[86dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-app">
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <h2 id="broadcast-title" className="display text-[19px] text-ink">
            {t("broadcast.title")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeBroadcast}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <X size={20} className="text-ink" />
          </button>
        </div>

        <div className="no-scrollbar space-y-4 overflow-y-auto px-5 pb-8">
          {broadcasts.map((b) => (
            <article
              key={b.id}
              className="rounded-[20px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand">
                  <Megaphone size={18} className="text-white" />
                </span>
                <h3 className="display text-[16px] text-ink">{b.title}</h3>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-body">{b.body}</p>
              <p className="mt-4 text-[12px] text-faint">
                {b.source} · {b.time}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
