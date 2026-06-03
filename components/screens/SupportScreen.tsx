"use client";

import { useState } from "react";
import { Check, ChevronDown, Play, TriangleAlert } from "lucide-react";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import { useApp } from "@/context/AppContext";
import {
  careGuides,
  contactMethods,
  helpOptions,
  patient,
  relatedAdvisories,
  routedPartners,
} from "@/lib/data";

type View = "request" | "guides";
type Step = "triage" | "form" | "sent";

export default function SupportScreen() {
  const { t, setTab } = useApp();
  const [view, setView] = useState<View>("request");

  return (
    <div className="px-5 pb-8 pt-6 lg:px-8 lg:pt-8">
      <div className="mx-auto w-full max-w-md">
        <SegmentedToggle<View>
          value={view}
          onChange={setView}
          options={[
            { value: "request", label: t("support.request") },
            { value: "guides", label: t("support.guides") },
          ]}
        />
      </div>

      {view === "request" ? (
        <div className="mx-auto mt-6 w-full max-w-xl">
          <RequestHelp onEscalate={() => setTab("contacts")} />
        </div>
      ) : (
        <div className="mx-auto mt-6 w-full max-w-3xl">
          <CareGuides />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Request help
function RequestHelp({ onEscalate }: { onEscalate: () => void }) {
  const { t } = useApp();
  const [step, setStep] = useState<Step>("triage");
  const [help, setHelp] = useState<string | null>(null);
  const [advisory, setAdvisory] = useState(relatedAdvisories[0]);
  const [location, setLocation] = useState("");
  const [method, setMethod] = useState(contactMethods[0]);

  if (step === "triage") {
    return (
      <div>
        <h1 className="display text-[26px] text-ink">{t("request.title")}</h1>
        <p className="mt-2 text-[15px] text-muted">{t("request.subtitle")}</p>

        <div className="mt-7 rounded-[22px] bg-white p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
          <p className="text-[18px] font-bold leading-tight text-ink">
            {t("request.lifeThreateningQ")}
          </p>
          <button
            type="button"
            onClick={onEscalate}
            className="mt-5 w-full rounded-full bg-danger py-4 text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(229,84,78,0.35)]"
          >
            {t("request.yesUrgent")}
          </button>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="mt-3 w-full rounded-full bg-subtle py-4 text-[16px] font-semibold text-ink"
          >
            {t("request.noContinue")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "sent") {
    return (
      <div className="rounded-[22px] bg-white p-6 text-center shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft">
          <Check size={32} className="text-brand" strokeWidth={3} />
        </span>
        <h2 className="display mt-4 text-[21px] text-ink">
          {t("request.sentTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-[34ch] text-[14px] leading-snug text-muted">
          {t("request.sentDesc")}
        </p>

        <p className="mt-6 text-left text-[12px] font-bold uppercase tracking-wider text-faint">
          {t("request.routedTo")}
        </p>
        <div className="mt-2 space-y-3">
          {routedPartners.map((p) => (
            <div
              key={p}
              className="rounded-2xl bg-app px-4 py-3.5 text-left text-[14px] text-ink"
            >
              {p}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setHelp(null);
            setLocation("");
            setStep("form");
          }}
          className="mt-6 w-full rounded-full bg-seg py-4 text-[16px] font-bold text-white"
        >
          {t("request.new")}
        </button>
      </div>
    );
  }

  // form
  return (
    <div>
      <button
        type="button"
        onClick={onEscalate}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-danger-soft px-4 py-3.5 text-[14px] font-bold text-danger"
      >
        <TriangleAlert size={20} />
        {t("request.escalationBanner")}
      </button>

      <div role="group" aria-labelledby="help-label">
        <h2 id="help-label" className="mt-6 text-[16px] font-bold text-ink">
          {t("request.whatHelp")}
        </h2>
        <div className="mt-3 space-y-3">
          {helpOptions.map((opt) => {
            const active = help === opt;
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={active}
                onClick={() => setHelp(opt)}
                className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-[15px] transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "bg-white text-ink shadow-[0_2px_10px_rgba(30,50,90,0.05)]"
                }`}
              >
                {opt}
                {active && <Check size={22} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-brand-soft/60 px-4 py-3.5 text-[14px] leading-snug text-body">
        <span className="font-bold text-ink">{t("request.careRecipient")} </span>
        {patient.name} · {patient.conditions.join(", ")}
      </div>

      <Dropdown
        id="advisory-select"
        label={t("request.relatedAdvisory")}
        value={advisory}
        options={relatedAdvisories}
        onChange={setAdvisory}
      />

      <label
        htmlFor="location-input"
        className="mt-5 block text-[15px] font-bold text-ink"
      >
        {t("request.location")}
      </label>
      <input
        id="location-input"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder={t("request.locationPlaceholder")}
        className="mt-2 w-full rounded-2xl bg-white px-4 py-4 text-[14px] text-ink shadow-[0_2px_10px_rgba(30,50,90,0.05)] outline-none placeholder:text-faint focus:ring-2 focus:ring-brand/40"
      />

      <div role="group" aria-labelledby="method-label">
        <h3 id="method-label" className="mt-5 text-[15px] font-bold text-ink">
          {t("request.contactMethod")}
        </h3>
        <div className="mt-2 flex gap-3">
          {contactMethods.map((m) => {
            const active = method === m;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={active}
                onClick={() => setMethod(m)}
                className={`flex-1 rounded-2xl py-3.5 text-[14px] font-semibold transition-colors ${
                  active
                    ? "bg-seg text-white"
                    : "bg-white text-body shadow-[0_2px_10px_rgba(30,50,90,0.05)]"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!help}
        onClick={() => setStep("sent")}
        className="mt-7 w-full rounded-full bg-brand py-4 text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] disabled:opacity-40 disabled:shadow-none"
      >
        {t("request.send")}
      </button>
    </div>
  );
}

function Dropdown({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-6">
      <label htmlFor={id} className="block text-[15px] font-bold text-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-2xl bg-white px-4 py-4 pr-11 text-[14px] text-ink shadow-[0_2px_10px_rgba(30,50,90,0.05)] outline-none focus:ring-2 focus:ring-brand/40"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={22}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-faint"
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- Care guides
function CareGuides() {
  const { t } = useApp();
  const procedures = careGuides.filter((g) => g.group === "procedure");

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader>{t("guides.procedure")}</SectionHeader>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {procedures.map((g) => (
            <div
              key={g.id}
              className="rounded-[22px] bg-white p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
            >
              <h3 className="text-[18px] font-bold text-ink">{g.title}</h3>
              <VideoPlaceholder label={g.title} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader>{t("guides.emergencyMedicine")}</SectionHeader>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {patient.emergencyMedicine.map((m) => (
            <div
              key={m.name}
              className="rounded-[22px] bg-white p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
            >
              <h3 className="text-[18px] font-bold text-ink">{m.name}</h3>
              <div className="mt-2 inline-block rounded-xl bg-brand-soft px-3.5 py-2 text-[13px] font-semibold text-brand">
                {m.dose}
              </div>
              <VideoPlaceholder label={m.name} />
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                {m.instructions}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2 className="display text-[19px] text-ink">{children}</h2>
      <div className="mt-3 border-b border-black/10" />
    </div>
  );
}

function VideoPlaceholder({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label} — guide video (placeholder)`}
      className="mt-4 flex aspect-video items-center justify-center rounded-2xl bg-video-bg"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-video-accent">
        <Play size={30} className="ml-1 text-video-icon" fill="currentColor" />
      </span>
    </div>
  );
}
