"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Megaphone, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { broadcasts } from "@/lib/data";

export default function BroadcastSheet() {
  const { broadcastOpen, closeBroadcast, t, tx } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

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
      className="fade-enter fixed inset-0 z-40 flex items-center justify-center p-4"
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
      <div className="pop-enter relative flex max-h-[86dvh] w-full max-w-lg flex-col rounded-[28px] bg-app">
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

        <div className="no-scrollbar space-y-3 overflow-y-auto px-5 pb-8">
          {broadcasts.map((b) => {
            const open = expanded === b.id;
            return (
              <article
                key={b.id}
                className="overflow-hidden rounded-[20px] bg-card shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : b.id)}
                  aria-expanded={open}
                  aria-controls={`broadcast-body-${b.id}`}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand">
                    <Megaphone size={18} className="text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="display block text-[16px] text-ink">{tx(b.title)}</span>
                    <span className="mt-0.5 block text-[12px] text-faint">
                      {b.source} · {b.time}
                    </span>
                  </span>
                  <ChevronDown
                    size={22}
                    className={`shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`broadcast-body-${b.id}`}
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-t border-black/5"
                    >
                      <p className="px-5 pb-5 pt-4 text-[14px] leading-relaxed text-body">
                        {tx(b.body)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
