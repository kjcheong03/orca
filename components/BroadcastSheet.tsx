"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Megaphone, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { filterBroadcastsForProfile } from "@/lib/broadcasts";
import { loadActiveProfile } from "@/lib/profiles";

export default function BroadcastSheet() {
  const { broadcastOpen, closeBroadcast, t, tx, broadcasts, lang } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Filter broadcasts down to those targeted at the active elder profile.
  // matchedTargets is populated upstream via the L1-L4 matcher cascade on
  // profile save, so this stays a pure synchronous overlap check.
  const activeProfile = useMemo(() => loadActiveProfile(), [broadcastOpen]);
  const visible = useMemo(
    () => filterBroadcastsForProfile(broadcasts, activeProfile?.matchedTargets ?? []),
    [broadcasts, activeProfile?.matchedTargets],
  );

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
          {visible.length === 0 && (
            <div className="rounded-[20px] bg-card px-5 py-10 text-center shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
              <p className="text-[15px] font-semibold text-ink">{tx("No active advisories")}</p>
              <p className="mt-1.5 text-[13px] text-muted">
                {tx("Official advisories will appear here when issued.")}
              </p>
            </div>
          )}
          {visible.map((b) => {
            const open = expanded === b.id;
            // Show the caregiver's app-language version when available; else English.
            const content = lang !== "en" && b.translations?.[lang] ? b.translations[lang] : { title: b.title, body: b.body };
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
                    <span className="flex items-center gap-2">
                      <span className="display text-[16px] text-ink">{tx(content.title)}</span>
                      {b.urgency === "HIGH" && (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                          {tx("Urgent")}
                        </span>
                      )}
                    </span>
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
                      <div className="px-5 pb-5 pt-4">
                        {renderBroadcastBody(content.body, tx)}
                      </div>
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

/** Render inline markdown within a line: [label](url) links and **bold**. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <a
          key={`${keyBase}-${k++}`}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand underline underline-offset-2"
        >
          {m[1]}
        </a>,
      );
    } else {
      out.push(
        <strong key={`${keyBase}-${k++}`} className="font-semibold text-ink">
          {m[3]}
        </strong>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Render an authority advisory body (markdown: **section headers**, paragraphs,
 *  [links](url)) with bold headers, spacing, and clickable links. */
function renderBroadcastBody(body: string, tx: (s: string) => string): ReactNode[] {
  const blocks: ReactNode[] = [];
  body.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const header = line.match(/^\*\*(.+?)\*\*$/);
    if (header) {
      blocks.push(
        <p key={i} className="mt-4 text-[12.5px] font-bold uppercase tracking-wide text-ink first:mt-0">
          {tx(header[1])}
        </p>,
      );
      return;
    }
    blocks.push(
      <p key={i} className="mt-1 text-[14px] leading-relaxed text-body">
        {renderInline(tx(line), String(i))}
      </p>,
    );
  });
  return blocks;
}
