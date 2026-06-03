"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Checklist from "@/components/ui/Checklist";
import { useApp } from "@/context/AppContext";
import { localizeAdvisory } from "@/lib/i18n";
import type { Advisory } from "@/lib/types";

const toneText: Record<string, string> = {
  warn: "text-warn",
  danger: "text-danger",
  brand: "text-brand",
};

export default function AdvisoryCard({
  advisory,
  variant,
}: {
  advisory: Advisory;
  variant: "environment" | "signal";
}) {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(false);
  const a = localizeAdvisory(advisory, lang);
  const tone = toneText[a.statusTone ?? "warn"] ?? "text-warn";

  return (
    <article className="overflow-hidden rounded-[var(--radius-card)] bg-card shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {variant === "environment" ? (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-app text-2xl">
                {a.icon}
              </span>
            ) : (
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-warn" />
            )}
            <h3 className="display text-[18px] text-ink">{a.title}</h3>
          </div>

          {a.status && (
            <div
              className={`mt-1 flex shrink-0 items-center gap-1.5 text-[13px] font-bold uppercase ${tone}`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {a.status}
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="source">{a.source}</Badge>
          {a.severity === "URGENT" ? (
            <Badge variant="urgent">{t("badge.urgent")}</Badge>
          ) : a.severity === "PRECAUTIONARY" ? (
            <Badge variant="precautionary">{t("badge.precautionary")}</Badge>
          ) : null}
          {a.metric && (
            <span className="ml-1 text-[15px] font-semibold text-ink">
              {a.metric}
            </span>
          )}
        </div>

        {a.summary && (
          <p className="mt-4 text-[14px] leading-snug text-body">{a.summary}</p>
        )}

        {/* What to do */}
        <p className="mt-5 mb-3 text-[12px] font-bold uppercase tracking-wider text-faint">
          {t("common.whatToDo")}
        </p>
        <Checklist items={a.whatToDo} />

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-[12px] text-faint">{a.updated}</span>
          {a.why && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-[13px] font-semibold text-brand"
              aria-expanded={open}
              aria-controls={`advisory-why-${a.id}`}
            >
              {t("common.why")}
              <ChevronDown
                size={20}
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Why? panel */}
      {open && a.why && (
        <div
          id={`advisory-why-${a.id}`}
          className="fade-enter border-t border-black/5 bg-surface-2 p-5"
        >
          <p className="text-[14px] leading-snug text-body">
            <span className="font-bold text-ink">{a.why.text.split(" — ")[0]}</span>
            {a.why.text.includes(" — ") ? ` — ${a.why.text.split(" — ").slice(1).join(" — ")}` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {a.why.conditions.map((c) => (
              <span
                key={c}
                className="rounded-full border border-brand/30 px-3.5 py-1.5 text-[13px] font-medium text-brand"
              >
                {c}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand"
          >
            <ExternalLink size={17} />
            {a.why.sourceLabel}
          </button>
        </div>
      )}
    </article>
  );
}
