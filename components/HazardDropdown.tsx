"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface Option<T extends string> {
  value: T;
  label: string;
  /** Tailwind bg class for the severity dot, e.g. "bg-danger". */
  dot?: string;
}

/**
 * Compact emergency switcher. The button shows the current emergency name + a
 * chevron; tapping it drops down the list of emergencies. Replaces the tabs.
 */
export default function HazardDropdown<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2.5 text-[14px] font-bold text-ink shadow-[0_4px_14px_rgba(30,50,90,0.15)] ring-1 ring-black/5"
      >
        {current?.dot && <span className={`h-2 w-2 rounded-full ${current.dot}`} />}
        {current?.label}
        <ChevronDown
          size={17}
          className={`text-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="fade-enter absolute left-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-2xl bg-card p-1.5 shadow-[0_8px_28px_rgba(30,50,90,0.18)] ring-1 ring-black/5"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition-colors ${
                    active ? "bg-app text-ink" : "text-body hover:bg-app"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {o.dot && <span className={`h-2 w-2 rounded-full ${o.dot}`} />}
                    {o.label}
                  </span>
                  {active && <Check size={16} className="text-brand" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
