"use client";

import { FileText, HeartPulse, MapPin, Pill } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { patient } from "@/lib/data";

// Mock caregiver notes — free-text context that doesn't fit other fields.
const additionalNotes = [
  "Prefers Mandarin; limited English.",
  "Lives alone; daughter visits on weekends.",
  "Walks with a cane — avoid stairs where possible.",
  "Spare keys kept with the neighbour at #08-43.",
];

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

export default function ProfileScreen() {
  const { t } = useApp();

  return (
    <div className="px-4 pb-8 pt-4 lg:pt-8">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        {/* Blue header */}
        <div className="bg-brand px-6 py-5 text-white">
          <h1 className="text-[22px] font-bold leading-tight">{patient.name}</h1>
          <p className="mt-1 text-[15px] text-white/90">
            {patient.sex} · {patient.age}
          </p>
        </div>

        {/* White body */}
        <div className="divide-y divide-black/[0.07] px-6">
          <Section icon={<MapPin size={17} />} label="Address">
            <p className="text-[14.5px] leading-snug text-ink">{patient.address}</p>
          </Section>

          <Section icon={<HeartPulse size={17} />} label={t("profile.conditions")}>
            <div className="flex flex-wrap gap-2">
              {patient.conditions.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-app px-3.5 py-1.5 text-[13.5px] font-semibold text-ink"
                >
                  {c}
                </span>
              ))}
            </div>
          </Section>

          <Section icon={<Pill size={17} />} label={t("profile.emergencyMedicine")}>
            <div className="space-y-3">
              {patient.emergencyMedicine.map((m) => (
                <div key={m.name} className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.08]">
                  <p className="text-[15px] font-bold text-ink">{m.name}</p>
                  <div className="mt-2 inline-block rounded-lg bg-[#4078ed] px-3 py-1.5 text-[13px] font-semibold text-white">
                    {m.dose}
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{m.instructions}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<FileText size={17} />} label="Additional notes">
            <ul className="space-y-2.5">
              {additionalNotes.map((note) => (
                <li key={note} className="flex gap-2.5 text-[14px] leading-snug text-ink">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/60" />
                  {note}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
