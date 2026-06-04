"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Car, Check, Compass, HeartHandshake, Package, UtensilsCrossed } from "lucide-react";
import { supportTemplates, type DraftTasks, type SupportTypeId } from "@/lib/community";

const icons: Record<SupportTypeId, typeof Package> = {
  supplies: Package,
  food: UtensilsCrossed,
  welfare: HeartHandshake,
  transport: Car,
  referral: Compass,
};

export default function ChooseHelp({
  tasks,
  incomplete,
  onToggleCategory,
  onToggleSubtype,
}: {
  tasks: DraftTasks;
  incomplete: SupportTypeId[];
  onToggleCategory: (type: SupportTypeId) => void;
  onToggleSubtype: (type: SupportTypeId, subtype: string) => void;
}) {
  return (
    <div className="space-y-3">
      {supportTemplates.map((tmpl) => {
        const active = tmpl.id in tasks;
        const selected = tasks[tmpl.id]?.subtypes ?? [];
        const Icon = icons[tmpl.id];
        return (
          <div
            key={tmpl.id}
            id={`cr-cat-${tmpl.id}`}
            className={`scroll-mt-24 overflow-hidden rounded-[20px] bg-card shadow-[0_2px_14px_rgba(30,50,90,0.06)] transition-shadow ${
              active ? "ring-2 ring-brand/40" : "ring-1 ring-black/[0.06]"
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleCategory(tmpl.id)}
              aria-pressed={active}
              className="flex w-full items-center gap-3.5 p-4 text-left"
            >
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-colors ${
                  active ? "bg-brand text-white" : "bg-app text-brand"
                }`}
              >
                <Icon size={22} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[15.5px] leading-tight text-ink ${
                    active ? "font-bold" : "font-semibold"
                  }`}
                >
                  {tmpl.label}
                </span>
              </span>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                  active ? "border-brand bg-brand text-white" : "border-black/20"
                }`}
              >
                {active && <Check size={14} strokeWidth={3.5} />}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden border-t border-black/5"
                >
                  <div className="flex flex-wrap gap-2 p-4">
                    {tmpl.subtypes.map((sub) => {
                      const on = selected.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => onToggleSubtype(tmpl.id, sub)}
                          aria-pressed={on}
                          className={`rounded-full px-3.5 py-2 text-[13px] transition-colors ${
                            on
                              ? "bg-app font-semibold text-brand ring-2 ring-inset ring-brand"
                              : "bg-app font-medium text-body hover:bg-subtle"
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                    {selected.length === 0 && incomplete.includes(tmpl.id) && (
                      <p className="w-full text-[12px] font-medium text-danger">
                        Please select at least one option.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
