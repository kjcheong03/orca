"use client";

import { useId } from "react";
import { motion } from "framer-motion";

interface Option<T extends string> {
  value: T;
  label: string;
}

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  fluid = true,
  bare = false,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "sm" is a compact pill (e.g. an inline corner toggle); "md" is the full control. */
  size?: "sm" | "md";
  /** Full-width with equal-width segments (default), or content-sized when false. */
  fluid?: boolean;
  /** Drop the enclosing track (no background/padding/shadow) — just the segments. */
  bare?: boolean;
}) {
  // Unique per instance so multiple toggles don't share the sliding pill.
  const layoutId = useId();
  const pad = size === "sm" ? "p-0.5" : "p-1";
  const btn = size === "sm" ? "px-3 py-1 text-[12px]" : "px-4 py-2 text-[13px]";
  return (
    <div
      role="group"
      aria-label={options.map((o) => o.label).join(" / ")}
      className={`${fluid ? "flex w-full" : "inline-flex"} items-center gap-1 ${
        bare ? "" : `rounded-full bg-track ${pad} shadow-sm`
      }`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`relative rounded-full font-semibold ${btn} ${fluid ? "flex-1" : ""}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-seg"
              />
            )}
            <span
              className={`relative z-10 transition-colors ${
                active ? "text-white" : "text-muted hover:text-ink"
              }`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
