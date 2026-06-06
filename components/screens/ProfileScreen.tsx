"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, FileText, HeartPulse, LogOut, MapPin, Pencil, Pill, Plus, Trash2, User, X } from "lucide-react";
import AddressFields from "@/components/AddressFields";
import { useApp } from "@/context/AppContext";
import { languageNames } from "@/lib/i18n";
import {
  blankMedicine,
  blankProfile,
  composeAddress,
  defaultCaregiver,
  defaultProfiles,
  ensureAddressParts,
  loadActiveId,
  loadCaregiver,
  loadProfiles,
  saveActiveId,
  saveCaregiver,
  saveProfiles,
  type CaregiverProfile,
  type ElderProfile,
} from "@/lib/profiles";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-brand";

const copy = (p: ElderProfile): ElderProfile => ({
  ...p,
  conditions: [...p.conditions],
  emergencyMedicine: p.emergencyMedicine.map((m) => ({ ...m })),
  notes: [...p.notes],
});

/** Trim and drop empty conditions / medicines / notes before saving. */
function clean(p: ElderProfile): ElderProfile {
  return {
    ...p,
    name: p.name.trim(),
    age: p.age.trim(),
    address: composeAddress(p), // full display address from the parts
    postalCode: p.postalCode?.trim(),
    addressLine: p.addressLine?.trim(),
    floor: p.floor?.trim(),
    unit: p.unit?.trim(),
    conditions: p.conditions.map((c) => c.trim()).filter(Boolean),
    emergencyMedicine: p.emergencyMedicine
      .map((m) => ({ name: m.name.trim(), dose: m.dose.trim(), instructions: m.instructions.trim() }))
      .filter((m) => m.name),
    notes: p.notes.map((n) => n.trim()).filter(Boolean),
  };
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-5">
      <div className="flex items-center gap-2.5">
        <span className="shrink-0 text-brand">{icon}</span>
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-faint">{label}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function IconButton({
  label,
  onClick,
  children,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "default" | "brand" | "danger";
}) {
  const toneCls =
    tone === "brand"
      ? "bg-brand text-white"
      : tone === "danger"
        ? "bg-card text-danger ring-1 ring-black/5"
        : "bg-card text-ink ring-1 ring-black/5 hover:text-brand";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-sm transition-colors ${toneCls}`}
    >
      {children}
    </button>
  );
}

export default function ProfileScreen() {
  const { t, tx, lang, openLangPicker } = useApp();
  const [profiles, setProfiles] = useState<ElderProfile[]>(defaultProfiles);
  const [activeId, setActiveId] = useState("p-default");
  const [editing, setEditing] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<ElderProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  // The caregiver's own profile (name + contact) — used to prefill request forms.
  const [caregiver, setCaregiver] = useState<CaregiverProfile>(defaultCaregiver);
  const [caregiverOpen, setCaregiverOpen] = useState(false);

  // localStorage is client-only — load after mount (initial render uses defaults,
  // matching the server render to avoid a hydration mismatch).
  useEffect(() => {
    const stored = loadProfiles();
    setProfiles(stored);
    const id = loadActiveId();
    setActiveId(stored.some((p) => p.id === id) ? id : stored[0].id);
    setCaregiver(loadCaregiver());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveProfiles(profiles);
  }, [profiles, hydrated]);

  // Remember which elderly is selected, so Contacts (and later the rest of the
  // app) can show / send the same person.
  useEffect(() => {
    if (hydrated && activeId) saveActiveId(activeId);
  }, [activeId, hydrated]);

  const active = profiles.find((p) => p.id === activeId) ?? profiles[0];
  const shown = editing && draft ? draft : active;
  const patch = (partial: Partial<ElderProfile>) =>
    setDraft((d) => (d ? { ...d, ...partial } : d));

  const startEdit = () => {
    setDraft(ensureAddressParts(copy(active)));
    setIsNew(false);
    setEditing(true);
  };

  const addProfile = () => {
    const np = blankProfile(`p-${profiles.length}-${profiles.reduce((n, p) => n + p.id.length, 0)}`);
    setProfiles((l) => [...l, np]);
    setActiveId(np.id);
    setDraft(copy(np));
    setIsNew(true);
    setEditing(true);
  };

  const cancel = () => {
    if (isNew && draft) {
      const remaining = profiles.filter((p) => p.id !== draft.id);
      setProfiles(remaining);
      setActiveId(remaining[0]?.id ?? "");
    }
    setEditing(false);
    setDraft(null);
    setIsNew(false);
  };

  const save = () => {
    if (!draft) return;
    const cleaned = clean(draft);
    setProfiles((l) => l.map((p) => (p.id === cleaned.id ? cleaned : p)));
    setActiveId(cleaned.id);
    setEditing(false);
    setDraft(null);
    setIsNew(false);
  };

  const deleteProfile = () => {
    const remaining = profiles.filter((p) => p.id !== active.id);
    if (remaining.length === 0) return; // keep at least one
    setProfiles(remaining);
    setActiveId(remaining[0].id);
    setEditing(false);
    setDraft(null);
    setIsNew(false);
  };

  const canDelete = !isNew && profiles.length > 1;

  return (
    <div className="px-4 pb-8 pt-4 lg:pt-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Toolbar — utility actions (incl. language) on the top row; the profile
            switcher (+ add) sits on its own row just below. */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2">
            {/* Language switcher — left-aligned white dropdown showing the name. */}
            <button
              type="button"
              onClick={openLangPicker}
              aria-label={tx("Change language")}
              title={tx("Change language")}
              className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-[13px] font-semibold text-ink shadow-sm ring-1 ring-black/10 transition-colors hover:border-brand"
            >
              {languageNames[lang]}
              <ChevronDown size={16} className="text-faint" />
            </button>

            <div className="flex items-center gap-2">
            {editing ? (
              <>
                {canDelete && (
                  <IconButton label={tx("Delete profile")} onClick={deleteProfile} tone="danger">
                    <Trash2 size={17} />
                  </IconButton>
                )}
                <IconButton label={tx("Cancel")} onClick={cancel}>
                  <X size={18} />
                </IconButton>
                <IconButton label={tx("Save")} onClick={save} tone="brand">
                  <Check size={18} strokeWidth={2.6} />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton label={tx("Your profile")} onClick={() => setCaregiverOpen(true)}>
                  <User size={16} />
                </IconButton>
                <IconButton label={tx("Log out")} onClick={() => { /* prototype: no auth yet */ }}>
                  <LogOut size={16} />
                </IconButton>
              </>
            )}
            </div>
          </div>

          <div className="no-scrollbar -my-1 mt-3 flex items-center gap-2 overflow-x-auto py-1">
            {profiles.map((p, i) => {
              const on = p.id === activeId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !editing && setActiveId(p.id)}
                  disabled={editing}
                  aria-label={p.name || tx("New profile")}
                  aria-pressed={on}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold ring-2 ring-inset transition-colors disabled:opacity-50 ${
                    on ? "bg-brand text-white ring-brand" : "bg-card text-brand ring-black/10"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
            <button
              type="button"
              onClick={addProfile}
              disabled={editing}
              aria-label={tx("Add elderly")}
              title={tx("Add elderly")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-dashed border-black/20 text-faint transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Profile card */}
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
          {/* Gradient header — the profile preview when viewing; a clear "Edit profile"
              title when editing (the fields below already carry the name/sex/age). */}
          <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-[#5b9be8] to-[#2563eb] px-6 py-5 text-white">
            {editing ? (
              <h1 className="text-[20px] font-bold leading-tight">
                {isNew ? tx("New profile") : tx("Edit profile")}
              </h1>
            ) : (
              <>
                <div className="min-w-0">
                  <h1 className="text-[22px] font-bold leading-tight">{shown.name || tx("New profile")}</h1>
                  <p className="mt-1 text-[15px] text-white/90">
                    {tx(shown.sex)} · {shown.age || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startEdit}
                  aria-label={tx("Edit profile")}
                  title={tx("Edit profile")}
                  className="shrink-0 text-white/85 transition-colors hover:text-white active:scale-95"
                >
                  <Pencil size={24} />
                </button>
              </>
            )}
          </div>

          {editing && draft ? (
            <EditForm draft={draft} patch={patch} tx={tx} />
          ) : (
            <div className="divide-y divide-black/[0.07] px-6">
              <Section icon={<MapPin size={17} />} label={tx("Address")}>
                <p className="text-[14.5px] leading-snug text-ink">{shown.address}</p>
              </Section>

              <Section icon={<HeartPulse size={17} />} label={t("profile.conditions")}>
                <div className="flex flex-wrap gap-2">
                  {shown.conditions.map((c) => (
                    <span key={c} className="rounded-full bg-app px-3.5 py-1.5 text-[13.5px] font-semibold text-ink">
                      {tx(c)}
                    </span>
                  ))}
                </div>
              </Section>

              <Section icon={<Pill size={17} />} label={t("profile.emergencyMedicine")}>
                <div className="space-y-3">
                  {shown.emergencyMedicine.map((m) => (
                    <div key={m.name} className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.08]">
                      <p className="text-[15px] font-bold text-ink">{m.name}</p>
                      <div className="mt-2 inline-block rounded-lg bg-gradient-to-br from-[#5b9be8] to-[#2563eb] px-3 py-1.5 text-[13px] font-semibold text-white">
                        {tx(m.dose)}
                      </div>
                      <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{tx(m.instructions)}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section icon={<FileText size={17} />} label={tx("Additional notes")}>
                <ul className="space-y-2.5">
                  {shown.notes.map((note) => (
                    <li key={note} className="flex gap-2.5 text-[14px] leading-snug text-ink">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/60" />
                      {tx(note)}
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          )}
        </div>
      </div>

      {caregiverOpen && (
        <CaregiverSheet
          caregiver={caregiver}
          tx={tx}
          onClose={() => setCaregiverOpen(false)}
          onSave={(c) => {
            setCaregiver(c);
            saveCaregiver(c);
            setCaregiverOpen(false);
          }}
        />
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-faint">{children}</label>;
}

/** The caregiver's own profile (name + contact) — viewed/edited from the toolbar. */
function CaregiverSheet({
  caregiver,
  onSave,
  onClose,
  tx,
}: {
  caregiver: CaregiverProfile;
  onSave: (c: CaregiverProfile) => void;
  onClose: () => void;
  tx: (s: string) => string;
}) {
  const [draft, setDraft] = useState<CaregiverProfile>(caregiver);
  const nameMissing = !draft.name.trim();
  const set = (partial: Partial<CaregiverProfile>) => setDraft((d) => ({ ...d, ...partial }));

  return (
    <div className="fade-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label={tx("Close")} onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="pop-enter relative w-full max-w-md rounded-t-[28px] bg-card p-6 sm:rounded-[28px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="display text-[18px] text-ink">{tx("Your profile")}</h2>
            <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
              {tx("Used to fill in your community support requests.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tx("Close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card shadow-sm"
          >
            <X size={18} className="text-ink" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <FieldLabel>
              {tx("Your name")} <span className="text-danger">*</span>
            </FieldLabel>
            <input
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder={tx("e.g. Chloe")}
              className={inputCls}
            />
            {nameMissing && (
              <p className="mt-1 text-[12px] font-medium text-danger">{tx("Please add your name")}</p>
            )}
          </div>
          <div>
            <FieldLabel>{tx("Contact number")}</FieldLabel>
            <input
              value={draft.contactNumber}
              onChange={(e) => set({ contactNumber: e.target.value })}
              placeholder="+65 8123 4567"
              className={inputCls}
            />
          </div>
          <div>
            <FieldLabel>{tx("Email")}</FieldLabel>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="name@example.com"
              className={inputCls}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={nameMissing}
          onClick={() =>
            onSave({
              name: draft.name.trim(),
              contactNumber: draft.contactNumber.trim(),
              email: draft.email.trim(),
            })
          }
          className="mt-5 w-full rounded-full bg-brand py-3 text-[15px] font-semibold text-white shadow-sm transition-colors disabled:bg-[#d5d9e1] disabled:text-[#6b7280] disabled:shadow-none"
        >
          {tx("Save")}
        </button>
      </div>
    </div>
  );
}

function EditForm({
  draft,
  patch,
  tx,
}: {
  draft: ElderProfile;
  patch: (partial: Partial<ElderProfile>) => void;
  tx: (s: string) => string;
}) {
  const [newCond, setNewCond] = useState("");

  const addCondition = () => {
    const c = newCond.trim();
    if (!c) return;
    patch({ conditions: [...draft.conditions, c] });
    setNewCond("");
  };

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Identity */}
      <div className="space-y-4">
        <div>
          <FieldLabel>{tx("Name")}</FieldLabel>
          <input value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder={tx("e.g. Madam Tan")} className={inputCls} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <FieldLabel>{tx("Sex")}</FieldLabel>
            <div className="relative">
              <select
                value={draft.sex}
                onChange={(e) => patch({ sex: e.target.value })}
                className={`${inputCls} appearance-none pr-9`}
              >
                {["Female", "Male"].map((s) => (
                  <option key={s} value={s}>
                    {tx(s)}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
            </div>
          </div>
          <div className="w-28">
            <FieldLabel>{tx("Age")}</FieldLabel>
            <input type="number" min={0} value={draft.age} onChange={(e) => patch({ age: e.target.value })} placeholder="78" className={inputCls} />
          </div>
        </div>
        <AddressFields value={draft} onChange={patch} />
      </div>

      {/* Conditions */}
      <div>
        <FieldLabel>{tx("Conditions")}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {draft.conditions.map((c, i) => (
            <span key={`${c}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-app py-1.5 pl-3.5 pr-2 text-[13.5px] font-semibold text-ink">
              {tx(c)}
              <button
                type="button"
                onClick={() => patch({ conditions: draft.conditions.filter((_, idx) => idx !== i) })}
                aria-label={tx("Delete")}
                className="grid h-4 w-4 place-items-center rounded-full text-faint hover:bg-black/10 hover:text-ink"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newCond}
            onChange={(e) => setNewCond(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCondition())}
            placeholder={tx("Add condition")}
            className={inputCls}
          />
          <button type="button" onClick={addCondition} aria-label={tx("Add condition")} className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-app text-brand hover:bg-subtle">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Emergency medicine */}
      <div>
        <FieldLabel>{tx("Emergency medicine")}</FieldLabel>
        <div className="space-y-3">
          {draft.emergencyMedicine.map((m, i) => {
            const setMed = (partial: Partial<typeof m>) =>
              patch({ emergencyMedicine: draft.emergencyMedicine.map((x, idx) => (idx === i ? { ...x, ...partial } : x)) });
            return (
              <div key={i} className="space-y-2 rounded-2xl bg-app p-3.5">
                <div className="flex gap-2">
                  <input value={m.name} onChange={(e) => setMed({ name: e.target.value })} placeholder={tx("Medicine name")} className={`${inputCls} font-semibold`} />
                  <button
                    type="button"
                    onClick={() => patch({ emergencyMedicine: draft.emergencyMedicine.filter((_, idx) => idx !== i) })}
                    aria-label={tx("Delete")}
                    className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-white text-danger ring-1 ring-black/5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <input value={m.dose} onChange={(e) => setMed({ dose: e.target.value })} placeholder={tx("Dose")} className={inputCls} />
                <textarea value={m.instructions} onChange={(e) => setMed({ instructions: e.target.value })} rows={2} placeholder={tx("Instructions")} className={`${inputCls} resize-none`} />
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => patch({ emergencyMedicine: [...draft.emergencyMedicine, blankMedicine()] })}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/20 py-2.5 text-[13px] font-semibold text-faint hover:border-brand hover:text-brand"
        >
          <Plus size={16} strokeWidth={2.5} /> {tx("Add medicine")}
        </button>
      </div>

      {/* Notes */}
      <div>
        <FieldLabel>{tx("Additional notes")}</FieldLabel>
        <div className="space-y-2">
          {draft.notes.map((note, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={note}
                onChange={(e) => patch({ notes: draft.notes.map((n, idx) => (idx === i ? e.target.value : n)) })}
                placeholder={tx("Add note")}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => patch({ notes: draft.notes.filter((_, idx) => idx !== i) })}
                aria-label={tx("Delete")}
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-app text-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => patch({ notes: [...draft.notes, ""] })}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/20 py-2.5 text-[13px] font-semibold text-faint hover:border-brand hover:text-brand"
        >
          <Plus size={16} strokeWidth={2.5} /> {tx("Add note")}
        </button>
      </div>
    </div>
  );
}
