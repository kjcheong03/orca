"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Minus, Plus, X } from "lucide-react";
import {
  getSupportTemplate,
  isFieldVisible,
  type DraftTasks,
  type FormField,
  type ItemQuantity,
  type SupportTypeId,
} from "@/lib/community";

const inputBase =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-brand";

type Value = string | string[] | boolean | ItemQuantity[] | undefined;

/** Per-item quantity rows for supplies (items come from Step 1 selections). */
function ItemQuantities({
  value,
  onChange,
}: {
  value: ItemQuantity[];
  onChange: (v: ItemQuantity[]) => void;
}) {
  const items = Array.isArray(value) ? value : [];
  const update = (i: number, patch: Partial<ItemQuantity>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  if (items.length === 0) return <p className="text-[13px] text-faint">No items selected.</p>;

  return (
    <div className="space-y-2.5">
      {items.map((it, i) => {
        const isOther = it.item === "Other item";
        return (
          <div key={it.item} className="rounded-xl border border-black/10 bg-white p-3">
            <p className="text-[13.5px] font-semibold text-ink">{it.item}</p>
            {isOther && (
              <input
                type="text"
                value={it.customItem ?? ""}
                onChange={(e) => update(i, { customItem: e.target.value })}
                placeholder="Specify item (e.g. adult diapers)"
                className={`${inputBase} mt-2 border-black/10`}
              />
            )}
            <input
              type="number"
              min={1}
              value={String(it.quantity ?? "")}
              onChange={(e) => update(i, { quantity: e.target.value })}
              placeholder="Quantity"
              className={`${inputBase} mt-2 w-32 border-black/10`}
            />
            {isOther && (
              <p className="mt-1.5 text-[12px] text-faint">
                Availability will be confirmed by the partner.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Dropdown multi-select: a select-like trigger, with chosen values shown as chips. */
function MultiSelectDropdown({
  options,
  value,
  error,
  placeholder,
  onChange,
}: {
  options: string[];
  value: string[];
  error?: boolean;
  placeholder: string;
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = Array.isArray(value) ? value : [];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = (o: string) =>
    onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputBase} flex items-center justify-between text-left ${
          error ? "border-danger" : "border-black/10"
        } ${selected.length ? "text-ink" : "text-faint"}`}
      >
        {selected.length ? `${selected.length} selected` : placeholder}
        <ChevronDown size={18} className="ml-2 shrink-0 text-faint" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-[0_8px_24px_rgba(30,50,90,0.14)]">
          {options.map((o) => {
            const on = selected.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggle(o)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[14px] text-ink hover:bg-app"
              >
                <span
                  className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border-2 transition-colors ${
                    on ? "border-brand bg-brand text-white" : "border-black/25"
                  }`}
                >
                  {on && <Check size={12} strokeWidth={3.5} />}
                </span>
                {o}
              </button>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((o) => (
            <span
              key={o}
              className="inline-flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-2.5 pr-1.5 text-[12.5px] font-semibold text-brand"
            >
              {o}
              <button
                type="button"
                onClick={() => toggle(o)}
                className="grid h-4 w-4 place-items-center rounded-full text-brand/70 hover:bg-brand/15 hover:text-brand"
                aria-label={`Remove ${o}`}
              >
                <X size={12} strokeWidth={3} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** DOM id for a field wrapper, so validation can scroll to it. */
export function fieldDomId(type: SupportTypeId, key: string) {
  return `cr-field-${type}-${key}`;
}

function chipCls(on: boolean) {
  return `rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
    on ? "bg-brand text-white" : "bg-app text-body hover:bg-subtle"
  }`;
}

function Field({
  id,
  field,
  value,
  error,
  onChange,
}: {
  id: string;
  field: FormField;
  value: Value;
  error?: string;
  onChange: (v: Value) => void;
}) {
  const borderCls = error ? "border-danger" : "border-black/10";
  const boxCls = `${inputBase} ${borderCls}`;

  // Note → an informational line, no input.
  if (field.kind === "note") {
    return (
      <div id={id} className="scroll-mt-24 rounded-xl bg-app px-3.5 py-3 text-[12.5px] leading-snug text-muted">
        {field.help}
      </div>
    );
  }

  // Toggle → a simple checkbox row (ticked = yes).
  if (field.kind === "toggle") {
    const on = value === true;
    return (
      <div id={id} className="scroll-mt-24">
        <button
          type="button"
          onClick={() => onChange(!on)}
          aria-pressed={on}
          className="flex items-center gap-3 text-left"
        >
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors ${
              on ? "border-brand bg-brand text-white" : "border-black/25"
            }`}
          >
            {on && <Check size={13} strokeWidth={3.5} />}
          </span>
          <span className={`text-[14px] ${error ? "text-danger" : "text-ink"}`}>{field.label}</span>
        </button>
        {error && <p className="mt-1 text-[12px] font-medium text-danger">{error}</p>}
      </div>
    );
  }

  let control: React.ReactNode;

  switch (field.kind) {
    case "textarea":
      control = (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={`${boxCls} resize-none`}
        />
      );
      break;
    case "number":
      control = (
        <input
          type="number"
          min={0}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={boxCls}
        />
      );
      break;
    case "datetime":
      control = (
        <input
          type="datetime-local"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={boxCls}
        />
      );
      break;
    case "date":
      control = (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={boxCls}
        />
      );
      break;
    case "select":
      control = (
        <div className="relative">
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={`${boxCls} appearance-none pr-9`}
          >
            <option value="" disabled>
              Select…
            </option>
            {field.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
          />
        </div>
      );
      break;
    case "radio":
      control = (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              aria-pressed={value === o}
              className={chipCls(value === o)}
            >
              {o}
            </button>
          ))}
        </div>
      );
      break;
    case "multiselect": {
      const arr = (value as string[]) ?? [];
      control = (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((o) => {
            const on = arr.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => onChange(on ? arr.filter((x) => x !== o) : [...arr, o])}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-full border py-2 pl-2.5 pr-3.5 text-[13px] font-semibold transition-colors ${
                  on ? "border-brand bg-brand-soft text-brand" : "border-black/10 bg-white text-body hover:bg-app"
                }`}
              >
                <span
                  className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border-2 transition-colors ${
                    on ? "border-brand bg-brand text-white" : "border-black/25"
                  }`}
                >
                  {on && <Check size={12} strokeWidth={3.5} />}
                </span>
                {o}
              </button>
            );
          })}
        </div>
      );
      break;
    }
    case "stepper": {
      const min = field.min ?? 0;
      const max = field.max ?? 99;
      const n = Math.min(max, Math.max(min, Number(value) || min));
      const stepBtn =
        "grid h-7 w-7 place-items-center rounded-full border border-black/15 text-ink transition-colors disabled:opacity-35 disabled:cursor-not-allowed hover:enabled:bg-app";
      control = (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onChange(String(Math.max(min, n - 1)))}
            disabled={n <= min}
            className={stepBtn}
            aria-label="Decrease"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <span className="min-w-6 text-center text-[14px] font-semibold text-ink">{n}</span>
          <button
            type="button"
            onClick={() => onChange(String(Math.min(max, n + 1)))}
            disabled={n >= max}
            className={stepBtn}
            aria-label="Increase"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      );
      break;
    }
    case "multiselectDropdown":
      control = (
        <MultiSelectDropdown
          options={field.options ?? []}
          value={(value as string[]) ?? []}
          error={!!error}
          placeholder={field.placeholder ?? "Select…"}
          onChange={(v) => onChange(v)}
        />
      );
      break;
    case "itemQuantities":
      control = (
        <ItemQuantities value={(value as ItemQuantity[]) ?? []} onChange={(v) => onChange(v)} />
      );
      break;
    default:
      control = (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={boxCls}
        />
      );
  }

  return (
    <div id={id} className="scroll-mt-24">
      <label className={`mb-1.5 flex items-center gap-1 text-[13px] font-semibold ${error ? "text-danger" : "text-ink"}`}>
        {field.label}
        {field.required && <span className="text-danger">*</span>}
      </label>
      {control}
      {field.help && !error && <p className="mt-1 text-[12px] text-faint">{field.help}</p>}
      {error && <p className="mt-1 text-[12px] font-medium text-danger">{error}</p>}
    </div>
  );
}

export default function DetailsForm({
  tasks,
  errors,
  onChangeDetail,
}: {
  tasks: DraftTasks;
  errors: Partial<Record<SupportTypeId, Record<string, string>>>;
  onChangeDetail: (type: SupportTypeId, key: string, value: Value) => void;
}) {
  const entries = (Object.entries(tasks) as [SupportTypeId, DraftTasks[SupportTypeId]][])
    .filter(([, t]) => (t?.subtypes.length ?? 0) > 0);

  return (
    <div className="space-y-4">
      {entries.map(([type, task]) => {
        const tmpl = getSupportTemplate(type);
        if (!tmpl || !task) return null;
        const errs = errors[type] ?? {};
        return (
          <section
            key={type}
            className="rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
          >
            <p className="text-[12px] font-bold uppercase tracking-wider text-faint">
              {tmpl.label}
            </p>
            {(() => {
              const visible = tmpl.fields
                .filter((f) => isFieldVisible(f, task.details, task.subtypes))
                .filter((f, i, arr) => arr.findIndex((g) => g.key === f.key) === i);

              // Group fields by their owning subtype; fields with no subtype are shared.
              const groups: { subtype: string; fields: FormField[] }[] = [];
              const shared: FormField[] = [];
              for (const f of visible) {
                if (!f.showWhenSubtype) {
                  shared.push(f);
                  continue;
                }
                let g = groups.find((x) => x.subtype === f.showWhenSubtype);
                if (!g) groups.push((g = { subtype: f.showWhenSubtype, fields: [] }));
                g.fields.push(f);
              }

              const heading = (text: string) => (
                <p className="border-b border-black/[0.07] pb-1.5 text-[13.5px] font-bold text-ink">
                  {text}
                </p>
              );
              const renderField = (f: FormField) => (
                <Field
                  key={f.key}
                  id={fieldDomId(type, f.key)}
                  field={f}
                  value={task.details[f.key] as Value}
                  error={errs[f.key]}
                  onChange={(v) => onChangeDetail(type, f.key, v)}
                />
              );

              return (
                <div className="mt-4 space-y-5">
                  {groups.map((g) => (
                    <div key={g.subtype} className="space-y-4">
                      {heading(g.subtype)}
                      <div className="space-y-4">{g.fields.map(renderField)}</div>
                    </div>
                  ))}
                  {shared.length > 0 && (
                    <div className="space-y-4">
                      {groups.length === 0 && heading(task.subtypes.join(" · "))}
                      {shared.map(renderField)}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        );
      })}
    </div>
  );
}
