"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import Mascot from "@/components/Mascot";
import { useApp } from "@/context/AppContext";
import {
  contactMethods,
  helpOptions,
  relatedAdvisories,
  routedPartners,
} from "@/lib/data";

type Step = "form" | "sent";

const QCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-black/10 bg-white px-4 py-5 shadow-[0_1px_3px_rgba(30,50,90,0.05)]">
    {children}
  </div>
);

const Question = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[15px] font-bold text-ink">{children}</p>
);

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors ${
        checked ? "border-brand bg-brand text-white" : "border-black/25"
      }`}
    >
      {checked && <Check size={12} strokeWidth={4} />}
    </span>
  );
}

export default function SupportScreen() {
  return (
    <div className="mx-auto w-full max-w-md space-y-3.5 px-4 pb-4 pt-5 lg:pt-8">
      <RequestForm />
    </div>
  );
}

function RequestForm() {
  const { t } = useApp();
  const [step, setStep] = useState<Step>("form");
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [advisory, setAdvisory] = useState(relatedAdvisories[0]);
  const [location, setLocation] = useState("");
  const [method, setMethod] = useState(contactMethods[0]);

  const toggle = (opt: string) =>
    setSelected((s) => (s.includes(opt) ? s.filter((x) => x !== opt) : [...s, opt]));
  const canSend = selected.length > 0 || custom.trim().length > 0;

  if (step === "sent") {
    return (
      <QCard>
        <h2 className="text-[16px] font-bold text-ink">{t("request.sentTitle")}</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">{t("request.sentDesc")}</p>

        <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-faint">
          {t("request.routedTo")}
        </p>
        <ul className="mt-1.5 space-y-1.5">
          {routedPartners.map((p) => (
            <li key={p} className="text-[14px] text-ink">
              • {p}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            setSelected([]);
            setCustom("");
            setLocation("");
            setStep("form");
          }}
          className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-[14px] font-semibold text-white"
        >
          {t("request.new")}
        </button>
      </QCard>
    );
  }

  return (
    <>
      {/* Header — no container, mascot + title on the page background */}
      <div className="flex items-center gap-3 px-1 pb-1 pt-1">
        <span className="-my-2 shrink-0">
          <Mascot size={56} variant="calm" />
        </span>
        <div className="min-w-0">
          <h1 className="text-[19px] font-bold leading-tight text-ink">
            {t("request.title")}
          </h1>
          <p className="text-[13px] font-medium text-faint">{t("request.nonEmergency")}</p>
        </div>
      </div>

      {/* What's needed — checkboxes + Other */}
      <QCard>
        <Question>{t("request.whatHelp")}</Question>
        <div className="mt-3">
          {helpOptions.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(opt)}
                className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-app/40"
              >
                <Checkbox checked={checked} />
                <span className="text-[14px] text-ink">{opt}</span>
              </button>
            );
          })}
          <div className="flex items-center gap-3 px-1.5 py-2">
            <Checkbox checked={custom.trim().length > 0} />
            <span className="text-[14px] text-muted">Other:</span>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="flex-1 border-b border-black/20 bg-transparent py-0.5 text-[14px] text-ink outline-none focus:border-brand"
            />
          </div>
        </div>
      </QCard>

      {/* Related advisory */}
      <QCard>
        <label htmlFor="advisory-select">
          <Question>{t("request.relatedAdvisory")}</Question>
        </label>
        <div className="relative mt-3">
          <select
            id="advisory-select"
            value={advisory}
            onChange={(e) => setAdvisory(e.target.value)}
            className="w-full appearance-none border-b border-black/20 bg-transparent py-2 pr-7 text-[14px] text-ink outline-none focus:border-brand"
          >
            {relatedAdvisories.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-faint"
          />
        </div>
      </QCard>

      {/* Location */}
      <QCard>
        <label htmlFor="location-input">
          <Question>{t("request.location")}</Question>
        </label>
        <input
          id="location-input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t("request.locationPlaceholder")}
          className="mt-3 w-full border-b border-black/20 bg-transparent py-2 text-[14px] text-ink outline-none placeholder:text-faint focus:border-brand"
        />
      </QCard>

      {/* Contact method — radios */}
      <QCard>
        <Question>{t("request.contactMethod")}</Question>
        <div className="mt-3" role="radiogroup">
          {contactMethods.map((m) => {
            const active = method === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMethod(m)}
                className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-app/40"
              >
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    active ? "border-brand" : "border-black/25"
                  }`}
                >
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                </span>
                <span className="text-[14px] text-ink">{m}</span>
              </button>
            );
          })}
        </div>
      </QCard>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          disabled={!canSend}
          onClick={() => setStep("sent")}
          className="rounded-lg bg-brand px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors disabled:bg-subtle disabled:text-faint disabled:shadow-none"
        >
          {t("request.send")}
        </button>
      </div>
    </>
  );
}
