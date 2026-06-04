"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse, MapPin, Pencil, Pill, Plus, Trash2, X } from "lucide-react";
import { CareProfileGlyph, SmsAlertGlyph, SolidPhone } from "@/components/glyphs";
import { useApp } from "@/context/AppContext";
import { ambulance, contacts, patient } from "@/lib/data";
import type { Contact } from "@/lib/types";

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function ContactsScreen() {
  const { t } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [list, setList] = useState<Contact[]>(contacts);
  const [formMode, setFormMode] = useState<{ type: "add" } | { type: "edit"; contact: Contact } | null>(null);
  const [actionsFor, setActionsFor] = useState<Contact | null>(null);

  const saveContact = (name: string, relation: string, phone: string) => {
    const base = { initials: initialsOf(name), name: name.trim(), relation: relation.trim(), phone: phone.trim() };
    if (formMode?.type === "edit") {
      const id = formMode.contact.id;
      setList((l) => l.map((c) => (c.id === id ? { ...c, ...base } : c)));
    } else {
      setList((l) => [...l, { id: `c-${Date.now()}`, role: "family", ...base }]);
    }
    setFormMode(null);
  };

  const deleteContact = (id: string) => {
    setList((l) => l.filter((c) => c.id !== id));
    setActionsFor(null);
  };

  const primary = list[0];
  const smsBody = `ALERT — ${patient.name} (${patient.sex}, ${patient.age}) may need help at ${patient.address}. Conditions: ${patient.conditions.join(", ")}. Please call to check on her.`;
  const smsHref = `sms:${primary.phone.replace(/\s/g, "")}?&body=${encodeURIComponent(smsBody)}`;

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-5 pb-8 pt-6 lg:pt-8">
      {/* Two key actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          onClick={() => setProfileOpen(true)}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="flex flex-col items-center gap-1 rounded-2xl bg-white px-3 py-3.5 shadow-[0_2px_14px_rgba(30,50,90,0.06)] hover:shadow-[0_8px_22px_rgba(30,50,90,0.12)]"
        >
          <CareProfileGlyph size={34} />
          <span className="text-[15px] font-bold text-ink">Care Profile</span>
        </motion.button>
        <motion.a
          href={smsHref}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="flex flex-col items-center gap-1 rounded-2xl bg-white px-3 py-3.5 shadow-[0_2px_14px_rgba(30,50,90,0.06)] hover:shadow-[0_8px_22px_rgba(30,50,90,0.12)]"
        >
          <SmsAlertGlyph size={34} />
          <span className="text-[15px] font-bold text-ink">SMS Alert</span>
        </motion.a>
      </div>

      {/* Emergency contacts */}
      <section className="pt-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-bold text-ink">{t("contacts.title")}</h2>
          <button
            type="button"
            onClick={() => setFormMode({ type: "add" })}
            aria-label="Add contact"
            className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white shadow-sm transition-transform active:scale-95"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(30,50,90,0.06)]">
          {list.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-black/10" : ""}`}
            >
              <button
                type="button"
                onClick={() => setActionsFor(c)}
                className="-my-1 min-w-0 flex-1 rounded-lg py-1 text-left transition-colors hover:bg-app/60"
              >
                <span className="flex items-baseline gap-2 truncate">
                  <span className="text-[15px] font-bold leading-tight text-ink">{c.name}</span>
                  <span className="text-[12px] font-medium text-faint">{c.relation}</span>
                </span>
                <span className="mt-0.5 block text-[13px] leading-tight text-muted">{c.phone}</span>
              </button>
              <a
                href={`tel:${c.phone.replace(/\s/g, "")}`}
                aria-label={`Call ${c.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5b9be8] text-white transition-transform active:scale-95"
              >
                <SolidPhone size={17} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 995 */}
      <a
        href={`tel:${ambulance.phone}`}
        className="mx-auto flex w-fit items-center justify-center gap-2.5 rounded-full bg-danger px-7 py-3.5 text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
      >
        <SolidPhone size={18} /> {t("contacts.needAmbulance")}
      </a>

      {profileOpen && <CareProfileSheet onClose={() => setProfileOpen(false)} />}
      {formMode && (
        <ContactFormSheet
          initial={formMode.type === "edit" ? formMode.contact : undefined}
          onClose={() => setFormMode(null)}
          onSave={saveContact}
        />
      )}
      {actionsFor && (
        <ContactActionsSheet
          contact={actionsFor}
          onClose={() => setActionsFor(null)}
          onEdit={() => {
            const c = actionsFor;
            setActionsFor(null);
            setFormMode({ type: "edit", contact: c });
          }}
          onDelete={() => deleteContact(actionsFor.id)}
        />
      )}
    </div>
  );
}

function ContactActionsSheet({
  contact,
  onClose,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fade-enter fixed inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Contact options"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="pop-enter relative w-full max-w-xs rounded-[28px] bg-card p-5">
        <p className="text-center text-[16px] font-bold text-ink">{contact.name}</p>
        <p className="mt-0.5 text-center text-[13px] text-muted">
          {[contact.relation, contact.phone].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-app py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-subtle"
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-danger-soft py-3 text-[14px] font-semibold text-[#b42318] transition-colors hover:brightness-95"
          >
            <Trash2 size={16} /> Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full py-2.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactFormSheet({
  initial,
  onClose,
  onSave,
}: {
  initial?: Contact;
  onClose: () => void;
  onSave: (name: string, relation: string, phone: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [relation, setRelation] = useState(initial?.relation ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nameErr = touched && !name.trim();
  const phoneErr = touched && !phone.trim();

  const save = () => {
    setTouched(true);
    if (!name.trim() || !phone.trim()) return;
    onSave(name, relation, phone);
  };

  const inputCls =
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-brand";

  return (
    <div
      className="fade-enter fixed inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Edit contact" : "Add contact"}
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="pop-enter relative w-full max-w-md rounded-[28px] bg-app p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-[20px] text-ink">{initial ? "Edit contact" : "Add contact"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <X size={18} className="text-ink" />
          </button>
        </div>

        <div className="space-y-4 rounded-[22px] bg-white p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
          <div>
            <label className={`mb-1.5 flex items-center gap-1 text-[13px] font-semibold ${nameErr ? "text-danger" : "text-ink"}`}>
              Name<span className="text-danger">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mr Tan Wei Ming"
              className={`${inputCls} ${nameErr ? "border-danger" : "border-black/10"}`}
            />
            {nameErr && <p className="mt-1 text-[12px] font-medium text-danger">Please add a name</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">Relationship</label>
            <input
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="e.g. Son"
              className={`${inputCls} border-black/10`}
            />
          </div>

          <div>
            <label className={`mb-1.5 flex items-center gap-1 text-[13px] font-semibold ${phoneErr ? "text-danger" : "text-ink"}`}>
              Contact number<span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+65 9123 4567"
              className={`${inputCls} ${phoneErr ? "border-danger" : "border-black/10"}`}
            />
            {phoneErr && <p className="mt-1 text-[12px] font-medium text-danger">Please add a number</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          className="mt-4 w-full rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm"
        >
          {initial ? "Save changes" : "Add contact"}
        </button>
      </div>
    </div>
  );
}

function CareProfileSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fade-enter fixed inset-0 z-40 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Care profile"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="sheet-enter relative w-full max-w-md rounded-t-[28px] bg-app p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-[20px] text-ink">Care profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <X size={18} className="text-ink" />
          </button>
        </div>

        <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
          <div className="flex items-center gap-3.5 bg-brand px-5 py-4 text-white">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-[18px] font-bold">
              {patient.initials}
            </span>
            <div className="min-w-0">
              <p className="text-[18px] font-bold leading-tight">{patient.name}</p>
              <p className="text-[13px] text-white/85">
                {patient.sex} · {patient.age}
              </p>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5">
            <ProfileRow icon={<MapPin size={18} />} label="Address">
              {patient.address}
            </ProfileRow>
            <ProfileRow icon={<HeartPulse size={18} />} label="Conditions">
              {patient.conditions.join(", ")}
            </ProfileRow>
            <ProfileRow icon={<Pill size={18} />} label="Emergency medicine">
              {patient.emergencyMedicine.map((m) => `${m.name} — ${m.dose}`).join("; ")}
            </ProfileRow>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0 shrink-0 text-brand">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-faint">{label}</p>
        <div className="mt-0 text-[14px] leading-snug text-ink">{children}</div>
      </div>
    </div>
  );
}
