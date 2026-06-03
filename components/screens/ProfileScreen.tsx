"use client";

import { MapPin, Upload } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { patient } from "@/lib/data";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-ink">
      {children}
    </h2>
  );
}

export default function ProfileScreen() {
  const { t } = useApp();

  return (
    <div className="px-4 pt-4 lg:pt-8">
      <div className="mx-auto w-full max-w-2xl rounded-[28px] bg-white px-6 pb-12 pt-7 shadow-[0_2px_14px_rgba(30,50,90,0.06)] lg:px-9">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="display max-w-[62%] text-[26px] leading-[1.05] text-ink">
            {patient.name}
          </h1>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[14px] font-semibold text-white shadow-sm"
          >
            <Upload size={20} />
            {t("profile.upload")}
          </button>
        </div>

        <p className="mt-3 text-[16px] text-muted">
          {patient.sex} · {patient.age}
        </p>

        <div className="mt-3 flex gap-2 text-[15px] leading-snug text-muted">
          <MapPin size={22} className="mt-0.5 shrink-0 text-brand" />
          <span>{patient.address}</span>
        </div>

        <hr className="my-7 border-black/10" />

        {/* Conditions */}
        <section className="mb-9">
          <SectionLabel>{t("profile.conditions")}</SectionLabel>
          <ul className="space-y-3.5">
            {patient.conditions.map((c) => (
              <li key={c} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
                <span className="text-[17px] text-ink">{c}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Emergency medicine */}
        <section className="mb-9">
          <SectionLabel>{t("profile.emergencyMedicine")}</SectionLabel>
          <div className="space-y-6">
            {patient.emergencyMedicine.map((m) => (
              <div key={m.name}>
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
                  <span className="text-[17px] font-bold text-ink">{m.name}</span>
                </div>
                <div className="ml-5 mt-2.5 inline-block rounded-xl bg-brand-soft px-3.5 py-2 text-[14px] font-semibold text-brand">
                  {m.dose}
                </div>
                <p className="ml-5 mt-3 text-[14px] leading-relaxed text-muted">
                  {m.instructions}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Measurements */}
        <section>
          <SectionLabel>{t("profile.measurements")}</SectionLabel>
          <div className="space-y-3">
            {patient.measurements.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between rounded-2xl bg-app px-4 py-3.5"
              >
                <div>
                  <p className="text-[14px] font-semibold text-ink">{m.label}</p>
                  <p className="text-[12px] text-faint">{m.takenAt}</p>
                </div>
                <span
                  className={`text-[15px] font-bold ${
                    m.status === "high" ? "text-warn" : "text-ink"
                  }`}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
