"use client";

import { useState } from "react";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Frown,
  Heart,
  Meh,
  Phone,
  PersonStanding,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ambulance, contacts, emergencyReasons, patient } from "@/lib/data";
import type { Contact, EmergencyReason } from "@/lib/types";

const reasonIcons: Record<string, LucideIcon> = {
  car: Car,
  heart: Heart,
  lungs: Wind,
  "user-x": Frown,
  "person-fall": PersonStanding,
  "user-sleep": Meh,
};

type Step = "list" | "reason" | "questions" | "call";
type Target = { kind: "contact"; contact: Contact } | { kind: "ambulance" };
type Answer = "Yes" | "No" | "Not sure";

export default function ContactsScreen() {
  const { t } = useApp();
  const [step, setStep] = useState<Step>("list");
  const [target, setTarget] = useState<Target | null>(null);
  const [reason, setReason] = useState<EmergencyReason | null>(null);
  const [awake, setAwake] = useState<Answer | null>(null);
  const [breathing, setBreathing] = useState<Answer | null>(null);

  function reset() {
    setStep("list");
    setTarget(null);
    setReason(null);
    setAwake(null);
    setBreathing(null);
  }

  function back() {
    if (step === "call") setStep("questions");
    else if (step === "questions") setStep("reason");
    else if (step === "reason") reset();
  }

  // ---------------------------------------------------------------- list
  if (step === "list") {
    return (
      <div className="mx-auto flex min-h-[78dvh] w-full max-w-md flex-col px-5 pb-8 pt-6 lg:min-h-[60vh] lg:pt-10">
        <h1 className="display text-center text-[23px] text-ink">
          {t("contacts.title")}
        </h1>
        <p className="mt-1 text-center text-[14px] text-muted">
          {t("contacts.subtitle")}
        </p>

        <div className="mt-7 space-y-4">
          {contacts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setTarget({ kind: "contact", contact: c });
                setStep("reason");
              }}
              className="flex w-full items-center gap-4 rounded-[20px] bg-white p-4 text-left shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-danger-soft text-[15px] font-bold text-danger">
                {c.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold text-ink">
                  {c.name}
                </span>
                <span className="flex items-center gap-1.5 text-[14px] text-muted">
                  <Phone size={16} /> {c.phone}
                </span>
              </span>
              <ChevronRight className="shrink-0 text-faint" size={24} />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setTarget({ kind: "ambulance" });
            setStep("reason");
          }}
          className="mt-auto flex items-center justify-center gap-3 rounded-full bg-danger px-6 py-5 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(229,84,78,0.4)]"
        >
          <Phone size={22} /> {t("contacts.needAmbulance")}
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------- reason
  if (step === "reason") {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-5 lg:pt-8">
        <BackBtn onClick={back} />
        <h1 className="display mt-4 text-[26px] text-ink">
          {t("emergency.whatHappened")}
        </h1>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {emergencyReasons.map((r) => {
            const Icon = reasonIcons[r.icon] ?? Heart;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setReason(r);
                  setStep("questions");
                }}
                className="flex flex-col items-center rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-danger">
                  <Icon size={34} className="text-white" strokeWidth={2.2} />
                </span>
                <span className="mt-4 text-[16px] font-bold text-ink">
                  {t(`reason.${r.id}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------- questions
  if (step === "questions") {
    return (
      <div className="mx-auto flex min-h-[78dvh] w-full max-w-md flex-col px-5 pb-8 pt-5 lg:min-h-0 lg:pt-8">
        <BackBtn onClick={back} />
        <h1 className="display mt-4 text-[26px] text-ink">
          {t("emergency.twoQuestions")}
        </h1>
        <p className="mt-3 text-[14px] text-muted">
          {t("emergency.twoQuestionsSub")}
        </p>

        <div className="mt-6 space-y-4">
          <QuestionCard
            label={t("emergency.isAwake")}
            value={awake}
            onChange={setAwake}
          />
          <QuestionCard
            label={t("emergency.isBreathing")}
            value={breathing}
            onChange={setBreathing}
          />
        </div>

        <button
          type="button"
          onClick={() => setStep("call")}
          className="mt-auto rounded-full bg-danger py-5 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(229,84,78,0.4)]"
        >
          {t("common.continue")}
        </button>
      </div>
    );
  }

  // --------------------------------------------------------------- call
  const isAmbulance = target?.kind === "ambulance";
  const calleeName = isAmbulance
    ? `995 · ${ambulance.label.split(" · ")[1] ?? "Ambulance"}`
    : target?.contact.name ?? "";
  const telHref = isAmbulance
    ? "tel:995"
    : `tel:${target?.contact.phone.replace(/\s/g, "")}`;

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-10 pt-5 lg:pt-8">
      <BackBtn onClick={back} />

      <p className="mt-3 text-center text-[13px] font-semibold uppercase tracking-wider text-faint">
        {t("emergency.calling")}
      </p>
      <h1 className="display mt-1 text-center text-[24px] text-ink">
        {calleeName}
      </h1>

      <div className="mt-3 flex justify-center">
        <span className="rounded-full bg-danger-soft px-5 py-2 text-[14px] font-semibold text-danger">
          {patient.name} · {reason ? t(`reason.${reason.id}`) : ""}
        </span>
      </div>
      <p className="mt-3 text-center text-[14px] text-muted">
        {t("emergency.pressToCall")}
      </p>

      {/* Call button */}
      <div className="relative my-7 flex justify-center">
        <span className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger [animation:cara-pulse_2s_ease-out_infinite]" />
        <span className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger [animation:cara-pulse_2s_ease-out_infinite_0.6s]" />
        <a
          href={telHref}
          className="relative flex h-36 w-36 items-center justify-center rounded-full bg-danger shadow-[0_16px_36px_rgba(229,84,78,0.45)]"
          aria-label={`Call ${calleeName}`}
        >
          <Phone size={48} className="text-white" fill="white" />
        </a>
      </div>

      {/* What to say */}
      <section className="rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
        <p className="text-[13px] font-bold uppercase tracking-wider text-danger">
          {t("emergency.whatToSay")}
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-body">
          {t("emergency.speakSlowly")}
        </p>
        <ul className="mt-1 space-y-1 text-[14px] leading-relaxed text-body">
          <li>
            • {t("emergency.who")}: {patient.name}, {patient.age} years old,{" "}
            {patient.sex.toLowerCase()}
          </li>
          <li>
            • {t("emergency.what")}: {reason?.statement}
          </li>
          <li>
            • {t("emergency.where")}: {patient.address}
          </li>
          {awake && (
            <li>
              • {t("emergency.awake")}: {awake}
            </li>
          )}
          {breathing && (
            <li>
              • {t("emergency.breathing")}: {breathing}
            </li>
          )}
        </ul>
      </section>

      {isAmbulance && (
        <section className="mt-4 rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
          <p className="text-[13px] font-bold uppercase tracking-wider text-danger">
            {t("emergency.doIfInstructed")}
          </p>
          <ul className="mt-3 space-y-1.5 text-[14px] leading-relaxed text-body">
            <li>• Stay on the line — do not hang up.</li>
            <li>• If they guide you through CPR or first aid, follow each step.</li>
            <li>• Unlock the door and clear a path for the paramedics.</li>
          </ul>
        </section>
      )}
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-black/5"
    >
      <ChevronLeft size={28} />
    </button>
  );
}

function QuestionCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Answer | null;
  onChange: (a: Answer) => void;
}) {
  const { t } = useApp();
  const options: { v: Answer; label: string }[] = [
    { v: "Yes", label: t("common.yes") },
    { v: "No", label: t("common.no") },
    { v: "Not sure", label: t("common.notSure") },
  ];
  return (
    <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
      <p className="text-[16px] font-bold text-ink">{label}</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.v)}
              className={`rounded-2xl py-3.5 text-[14px] font-semibold transition-colors ${
                active ? "bg-danger text-white" : "bg-subtle text-body"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
