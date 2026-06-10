"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  HeartPulse,
  IdCard,
  Languages,
  Loader2,
  MapPin,
  MessageSquare,
  MessageSquareWarning,
  Mic,
  Pencil,
  Pill,
  Plus,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { SolidPhone } from "@/components/glyphs";
import { useApp } from "@/context/AppContext";
import { useOnline } from "@/lib/online";
import { ambulance } from "@/lib/data";
import { defaultProfiles, loadActiveProfile, type ElderProfile } from "@/lib/profiles";
import {
  defaultContacts,
  loadAlertMessage,
  loadContacts,
  saveAlertMessage,
  saveContacts,
} from "@/lib/contacts";
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
  const { t, tx, lang, tab } = useApp();
  const online = useOnline();
  const [list, setList] = useState<Contact[]>(() => defaultContacts());
  const [formMode, setFormMode] = useState<{ type: "add" } | { type: "edit"; contact: Contact } | null>(null);
  const [actionsFor, setActionsFor] = useState<Contact | null>(null);
  const [careOpen, setCareOpen] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [smsFor, setSmsFor] = useState<Contact | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // The care recipient shown here is the active profile (edited on the Profile
  // screen). Screens stay mounted, so re-read it whenever this tab is opened.
  const [profile, setProfile] = useState<ElderProfile>(() => defaultProfiles()[0]);
  useEffect(() => {
    setProfile(loadActiveProfile());
  }, [tab]);

  // Emergency contacts and the alert draft persist to localStorage, so adding /
  // deleting a contact and the message survive a reload. Hydrate after mount
  // (initial render stays the seeded defaults so SSR markup matches), then write
  // back on every change once hydrated — never clobbering stored data on mount.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setList(loadContacts());
    setMsg(loadAlertMessage());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveContacts(list);
  }, [list, hydrated]);
  useEffect(() => {
    if (hydrated) saveAlertMessage(msg);
  }, [msg, hydrated]);

  // Care-card details — kept entirely separate from the alert message.
  const cardDetails = [
    `${profile.name} (${profile.sex}, ${profile.age})`,
    profile.address,
    `Conditions: ${profile.conditions.join(", ")}`,
    `Emergency medicine: ${profile.emergencyMedicine.map((m) => `${m.name} — ${m.dose}`).join("; ")}`,
  ].join("\n");

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

  // Voice input for the alert message (same pattern as Ask ORCA): record →
  // transcribe via /api/transcribe → drop the text into the box to review.
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size === 0) return;
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "speech.webm");
          form.append("lang", lang);
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await res.json();
          if (data.text) setMsg((prev) => (prev ? `${prev} ${data.text}` : data.text));
        } catch {
          /* leave the box as-is on failure */
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  function stopRecording() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-5 pb-8 pt-6 lg:pt-8">
      {/* Emergency Card — expandable, revealing the full care card */}
      <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        <button
          type="button"
          onClick={() => setCareOpen((o) => !o)}
          aria-expanded={careOpen}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <IdCard size={22} className="text-brand" />
          <span className="flex-1 text-[15px] font-bold text-ink">{tx("Emergency Card")}</span>
          <ChevronDown
            size={18}
            className={`text-faint transition-transform ${careOpen ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {careOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-black/[0.06]"
            >
              <div className="p-4">
                <div className="overflow-hidden rounded-[18px] ring-1 ring-black/[0.07]">
                  <div className="bg-gradient-to-br from-[#5b9be8] to-[#2563eb] px-5 py-4 text-white">
                    <p className="text-[18px] font-bold leading-tight">{profile.name}</p>
                    <p className="mt-0.5 text-[15px] text-white/90">
                      {tx(profile.sex)} · {profile.age}
                    </p>
                  </div>
                  <div className="space-y-4 px-5 py-5">
                    <ProfileRow icon={<MapPin size={18} />} label={tx("Address")}>
                      {profile.address}
                    </ProfileRow>
                    <ProfileRow icon={<HeartPulse size={18} />} label={tx("Conditions")}>
                      {profile.conditions.map((c) => tx(c)).join(", ")}
                    </ProfileRow>
                    <ProfileRow icon={<Pill size={18} />} label={tx("Emergency medicine")}>
                      {profile.emergencyMedicine.map((m) => `${m.name} — ${tx(m.dose)}`).join("; ")}
                    </ProfileRow>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alert message — view / edit then send */}
      <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        <button
          type="button"
          onClick={() => setAlertOpen((o) => !o)}
          aria-expanded={alertOpen}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <MessageSquareWarning size={22} className="text-brand" />
          <span className="flex-1 text-[15px] font-bold text-ink">{tx("Alert message")}</span>
          <ChevronDown
            size={18}
            className={`text-faint transition-transform ${alertOpen ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {alertOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-black/[0.06]"
            >
              <div className="px-4 py-4">
                <p className="mb-2.5 text-[12.5px] font-medium leading-snug text-faint">
                  {tx("You can attach this alert message when you SMS an emergency contact below.")}
                </p>
                <div className="rounded-xl border border-black/10 bg-white focus-within:border-brand">
                  <textarea
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    rows={5}
                    disabled={recording || transcribing}
                    placeholder={
                      recording
                        ? tx("Listening…")
                        : transcribing
                          ? tx("Transcribing…")
                          : tx("Type an alert message, or record one…")
                    }
                    className="w-full resize-none bg-transparent px-3.5 pt-2.5 text-[13.5px] leading-snug text-ink outline-none placeholder:text-faint"
                  />
                  <div className="flex items-center justify-between px-2.5 pb-2">
                    <button
                      type="button"
                      onClick={() => setMsg("")}
                      disabled={!msg || recording || transcribing}
                      className="rounded-lg px-2 py-1 text-[12.5px] font-semibold text-faint transition-colors hover:text-ink disabled:opacity-40"
                    >
                      {tx("Clear")}
                    </button>
                    <button
                      type="button"
                      onClick={recording ? stopRecording : startRecording}
                      disabled={transcribing || !online}
                      aria-label={recording ? tx("Stop recording") : tx("Record voice message")}
                      title={!online ? tx("Voice needs a connection") : undefined}
                      className={`grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-95 disabled:opacity-50 ${
                        recording ? "animate-pulse bg-danger text-white" : "bg-app text-brand"
                      }`}
                    >
                      {transcribing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : recording ? (
                        <Square size={14} className="fill-white" />
                      ) : (
                        <Mic size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 995 — divider with extra breathing room above the button */}
      <div className="border-t border-black/[0.08] pt-7">
        <a
          href={`tel:${ambulance.phone}`}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-danger px-7 py-3.5 text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
        >
          <SolidPhone size={18} /> {t("contacts.needAmbulance")}
        </a>
      </div>

      {/* Emergency Contacts */}
      <section className="pt-1">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <h2 className="text-[15px] font-bold text-ink">{tx("Emergency Contacts")}</h2>
          <button
            type="button"
            onClick={() => setFormMode({ type: "add" })}
            aria-label="Add contact"
            className="text-faint transition-colors hover:text-brand"
          >
            <Plus size={17} strokeWidth={2.5} />
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(30,50,90,0.06)]">
          {list.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-center gap-2.5 px-4 py-3 ${i > 0 ? "border-t border-black/10" : ""}`}
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
              <button
                type="button"
                onClick={() => setSmsFor(c)}
                aria-label={`SMS ${c.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app text-brand transition-transform active:scale-95"
              >
                <MessageSquare size={17} />
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
      {smsFor && (
        <SmsSheet
          contact={smsFor}
          alertText={msg}
          cardDetails={cardDetails}
          onClose={() => setSmsFor(null)}
        />
      )}
    </div>
  );
}

function Checkbox({ on }: { on: boolean }) {
  return (
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors ${
        on ? "border-brand bg-brand text-white" : "border-black/25"
      }`}
    >
      {on && <Check size={13} strokeWidth={3.5} />}
    </span>
  );
}

// Recipient languages the alert can be sent in. The first is the default.
const SEND_LANGS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "ta", label: "தமிழ்" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "tl", label: "Tagalog" },
  { code: "my", label: "မြန်မာ" },
];

/** Per-contact SMS: pick what to attach (emergency card / the alert message /
 *  a translated version), then deep-link to the phone's Messages app for that
 *  one number. Single recipient keeps delivery reliable across iOS/Android
 *  (a multi-number sms: link is flaky) and sends from the caregiver's own
 *  number — no server, no cost. */
function SmsSheet({
  contact,
  alertText,
  cardDetails,
  onClose,
}: {
  contact: Contact;
  alertText: string;
  cardDetails: string;
  onClose: () => void;
}) {
  const { tx, txf, lang } = useApp();
  const online = useOnline();
  const hasMessage = alertText.trim().length > 0;
  const [withCard, setWithCard] = useState(true);
  const [withMessage, setWithMessage] = useState(hasMessage);
  const [translateOn, setTranslateOn] = useState(false);
  const [targetCode, setTargetCode] = useState("en");
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Translate only makes sense when there's a message to include, we're online,
  // and the chosen language differs from the compose language.
  const translateActive = translateOn && withMessage && hasMessage && online;
  useEffect(() => {
    if (!translateActive || targetCode === lang) {
      setTranslated(null);
      setTranslating(false);
      return;
    }
    let cancelled = false;
    setTranslating(true);
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: alertText, target: targetCode }),
    })
      .then((r) => r.json())
      .then((d) => !cancelled && setTranslated(typeof d.text === "string" ? d.text : null))
      .catch(() => !cancelled && setTranslated(null))
      .finally(() => !cancelled && setTranslating(false));
    return () => {
      cancelled = true;
    };
  }, [translateActive, targetCode, alertText, lang]);

  const messageOut = withMessage
    ? translateActive && targetCode !== lang
      ? (translated ?? alertText.trim())
      : alertText.trim()
    : "";
  const cardOut = withCard ? cardDetails : "";
  const body = [messageOut, cardOut].filter(Boolean).join("\n\n");
  const number = contact.phone.replace(/\s/g, "");
  const href = `sms:${number}${body ? `?&body=${encodeURIComponent(body)}` : ""}`;

  return (
    <div
      className="fade-enter fixed inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={txf("Send SMS to {name}", { name: contact.name })}
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="pop-enter relative flex max-h-[86dvh] w-full max-w-sm flex-col rounded-[28px] bg-card">
        <div className="px-5 pb-3 pt-5">
          <p className="text-[16px] font-bold text-ink">{txf("Send SMS to {name}", { name: contact.name })}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            {[contact.relation, contact.phone].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="no-scrollbar space-y-2 overflow-y-auto px-5">
          {/* Include emergency card */}
          <button
            type="button"
            onClick={() => setWithCard((v) => !v)}
            aria-pressed={withCard}
            className="flex w-full items-center gap-3 rounded-2xl bg-app px-4 py-3 text-left"
          >
            <IdCard size={18} className="shrink-0 text-brand" />
            <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink">
              {tx("Include emergency card")}
            </span>
            <Checkbox on={withCard} />
          </button>

          {/* Include alert message */}
          <button
            type="button"
            onClick={() => hasMessage && setWithMessage((v) => !v)}
            aria-pressed={withMessage && hasMessage}
            disabled={!hasMessage}
            className="flex w-full items-center gap-3 rounded-2xl bg-app px-4 py-3 text-left disabled:opacity-50"
          >
            <MessageSquareWarning size={18} className="shrink-0 text-brand" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-ink">{tx("Include alert message")}</span>
              {!hasMessage && (
                <span className="block text-[12px] text-faint">{tx("No message written yet")}</span>
              )}
            </span>
            <Checkbox on={withMessage && hasMessage} />
          </button>

          {/* Translate message */}
          <button
            type="button"
            onClick={() => setTranslateOn((v) => !v)}
            aria-pressed={translateActive}
            disabled={!withMessage || !hasMessage || !online}
            className="flex w-full items-center gap-3 rounded-2xl bg-app px-4 py-3 text-left disabled:opacity-50"
          >
            <Languages size={18} className="shrink-0 text-brand" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-ink">{tx("Translate message")}</span>
              {!online ? (
                <span className="block text-[12px] text-faint">{tx("needs a connection")}</span>
              ) : !withMessage || !hasMessage ? (
                <span className="block text-[12px] text-faint">{tx("Include a message first")}</span>
              ) : null}
            </span>
            <Checkbox on={translateActive} />
          </button>

          {/* Recipient language + translated preview — only when translating */}
          {translateActive && (
            <div className="rounded-2xl bg-app px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold uppercase tracking-wider text-faint">{tx("Send in")}</span>
                <div className="relative">
                  <select
                    value={targetCode}
                    onChange={(e) => setTargetCode(e.target.value)}
                    className="appearance-none rounded-lg border border-black/10 bg-white py-1.5 pl-3 pr-8 text-[13px] font-semibold text-ink outline-none focus:border-brand"
                  >
                    {SEND_LANGS.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-faint" />
                </div>
              </div>
              <div className="mt-2 max-h-24 overflow-y-auto rounded-xl bg-white px-3 py-2 text-[13px] leading-snug text-body">
                {translating ? (
                  <span className="flex items-center gap-1.5 text-faint">
                    <Loader2 size={14} className="animate-spin" /> {tx("Translating…")}
                  </span>
                ) : (
                  messageOut || alertText.trim()
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-3">
          {translating ? (
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d5d9e1] py-3.5 text-[15px] font-semibold text-[#6b7280]"
            >
              <Loader2 size={16} className="animate-spin" /> {tx("Translating…")}
            </button>
          ) : (
            <a
              href={href}
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm transition-transform active:scale-[0.99]"
            >
              <Send size={17} /> {tx("Send SMS")}
            </a>
          )}
        </div>
      </div>
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
  const { tx } = useApp();
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
            <Pencil size={16} /> {tx("Edit")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-danger-soft py-3 text-[14px] font-semibold text-[#b42318] transition-colors hover:brightness-95"
          >
            <Trash2 size={16} /> {tx("Delete")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full py-2.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
          >
            {tx("Cancel")}
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
  const { tx } = useApp();
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
          <h2 className="display text-[20px] text-ink">{initial ? tx("Edit contact") : tx("Add contact")}</h2>
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
              {tx("Name")}<span className="text-danger">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tx("e.g. Mr Tan Wei Ming")}
              className={`${inputCls} ${nameErr ? "border-danger" : "border-black/10"}`}
            />
            {nameErr && <p className="mt-1 text-[12px] font-medium text-danger">{tx("Please add a name")}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">{tx("Relationship")}</label>
            <input
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder={tx("e.g. Son")}
              className={`${inputCls} border-black/10`}
            />
          </div>

          <div>
            <label className={`mb-1.5 flex items-center gap-1 text-[13px] font-semibold ${phoneErr ? "text-danger" : "text-ink"}`}>
              {tx("Contact number")}<span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+65 9123 4567"
              className={`${inputCls} ${phoneErr ? "border-danger" : "border-black/10"}`}
            />
            {phoneErr && <p className="mt-1 text-[12px] font-medium text-danger">{tx("Please add a number")}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          className="mt-4 w-full rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm"
        >
          {initial ? tx("Save changes") : tx("Add contact")}
        </button>
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
