"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse, MapPin, Pill, X } from "lucide-react";

// Slim, solid phone handset (Material-style) — no signal waves.
function SolidPhone({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}
import { CareProfileGlyph, SmsAlertGlyph } from "@/components/glyphs";
import { useApp } from "@/context/AppContext";
import { ambulance, contacts, patient } from "@/lib/data";

export default function ContactsScreen() {
  const { t } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);

  const primary = contacts[0];
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
          <span className="text-[13px] font-semibold text-ink">Care Profile</span>
        </motion.button>
        <motion.a
          href={smsHref}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="flex flex-col items-center gap-1 rounded-2xl bg-white px-3 py-3.5 shadow-[0_2px_14px_rgba(30,50,90,0.06)] hover:shadow-[0_8px_22px_rgba(30,50,90,0.12)]"
        >
          <SmsAlertGlyph size={34} />
          <span className="text-[13px] font-semibold text-ink">SMS Alert</span>
        </motion.a>
      </div>

      {/* Emergency contacts */}
      <section className="pt-3">
        <h2 className="mb-3 px-1 text-[16px] font-bold text-ink">
          {t("contacts.title")}
        </h2>
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(30,50,90,0.06)]">
          {contacts.map((c, i) => (
            <a
              key={c.id}
              href={`tel:${c.phone.replace(/\s/g, "")}`}
              className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-app/60 ${
                i > 0 ? "border-t border-black/10" : ""
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold leading-tight text-ink">
                  {c.name}
                  <span className="ml-2 text-[12px] font-normal text-muted">
                    {c.relation}
                  </span>
                </span>
                <span className="mt-0.5 block text-[12px] leading-tight text-muted">
                  {c.phone}
                </span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5b9be8] text-white">
                <SolidPhone size={17} />
              </span>
            </a>
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
