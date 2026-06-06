"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";

const TRIGGER =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-brand";

/**
 * Single-select dropdown with type-to-filter search. Used for location pickers
 * (a long, representative list), so the user can type to narrow instead of
 * scrolling. Selected option shows in blue with a tick — matching the language menu.
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  error?: boolean;
  /** id on the wrapper so a form can scroll to it on validation. */
  id?: string;
}) {
  const { tx } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => tx(o).toLowerCase().includes(q) || o.toLowerCase().includes(q));
  }, [options, query, tx]);

  const pick = (o: string) => {
    onChange(o);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} id={id} className="relative scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${TRIGGER} flex items-center justify-between text-left ${
          error ? "border-danger" : "border-black/10"
        } ${value ? "text-ink" : "text-faint"}`}
      >
        {value ? tx(value) : (placeholder ?? tx("Select…"))}
        <ChevronDown size={18} className="ml-2 shrink-0 text-faint" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(30,50,90,0.14)]">
          <div className="border-b border-black/[0.06] p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx("Search…")}
              className="w-full rounded-lg bg-app px-3 py-2 text-[13.5px] text-ink outline-none placeholder:text-faint"
            />
          </div>
          <div className="no-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <p className="px-3.5 py-3 text-[13px] text-faint">{tx("No matches")}</p>
            ) : (
              filtered.map((o) => {
                const on = o === value;
                return (
                  <button
                    key={o}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => pick(o)}
                    className={`flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-left text-[14px] transition-colors ${
                      on ? "bg-brand-soft font-semibold text-brand" : "text-ink hover:bg-app"
                    }`}
                  >
                    {tx(o)}
                    {on && <Check size={16} strokeWidth={3} className="shrink-0 text-brand" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
