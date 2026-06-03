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
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  // Unique per instance so multiple toggles don't share the sliding pill.
  const layoutId = useId();
  return (
    <div
      role="group"
      aria-label={options.map((o) => o.label).join(" / ")}
      className="flex w-full items-center gap-1 rounded-full bg-track p-1 shadow-sm"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className="relative flex-1 rounded-full px-4 py-2 text-[13px] font-semibold"
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
