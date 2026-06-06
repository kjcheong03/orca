"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import Mascot from "@/components/Mascot";
import ChooseHelp from "@/components/community/ChooseHelp";
import ContactDetails, { contactFieldId, type ContactInfo } from "@/components/community/ContactDetails";
import DetailsForm, { fieldDomId } from "@/components/community/DetailsForm";
import ReviewMatch from "@/components/community/ReviewMatch";
import { useApp } from "@/context/AppContext";
import { patient } from "@/lib/data";
import { composeAddress, ensureAddressParts, loadActiveProfile } from "@/lib/profiles";
import {
  getSupportTemplate,
  isFieldVisible,
  type DraftTasks,
  type ItemQuantity,
  type SupportTypeId,
  type TaskState,
} from "@/lib/community";

const shortName = patient.name.split(" ").slice(0, 2).join(" "); // "Madam Tan"
const LINKED_TOPIC = "Dengue alert";

const STEPS = ["Choose help", "Request details", "Personal details", "Match & review"] as const;

type FieldValue = string | string[] | boolean | ItemQuantity[] | undefined;

/** Prefill sensible details from the chosen subtypes when entering Step 2. */
function withDefaults(type: SupportTypeId, task: TaskState): TaskState {
  const { subtypes } = task;
  const d: Record<string, unknown> = { ...task.details };
  if (type === "supplies") {
    // Reconcile per-item rows to the Step 1 selection, keeping any quantities.
    const existing = Array.isArray(d.itemsNeeded) ? (d.itemsNeeded as ItemQuantity[]) : [];
    d.itemsNeeded = subtypes.map((item) => {
      const prev = existing.find((e) => e.item === item);
      return prev ?? { item, quantity: "" };
    });
  }
  if (type === "food") {
    if (subtypes.includes("Cooked meals") && d.portionsPerMeal === undefined) {
      d.portionsPerMeal = "1";
    }
  }
  if (type === "transport") {
    if (d.wheelchairRequired === undefined) d.wheelchairRequired = false;
    if (d.escortNeeded === undefined) d.escortNeeded = false;
    if (d.caregiverAccompanying === undefined) d.caregiverAccompanying = false;
    if (d.returnTripNeeded === undefined) d.returnTripNeeded = false;
  }
  return { subtypes, details: d };
}

/** Infer the matching area from a Singapore postal code (sector-based). */
function inferArea(postalCode: string): string {
  const p = postalCode.trim();
  if (p.startsWith("31")) return "Toa Payoh";
  if (p.startsWith("57")) return "Bishan";
  if (p.startsWith("56")) return "Ang Mo Kio";
  return "Ang Mo Kio";
}

/** Whether any selected task needs someone to come to the home (→ ask address). */
function needsAddress(tasks: DraftTasks): boolean {
  for (const [type, t] of Object.entries(tasks) as [SupportTypeId, TaskState][]) {
    if (!t || t.subtypes.length === 0) continue;
    const d = t.details;
    if (type === "supplies") {
      if (d.suppliesFulfilment === "Delivery if available" || d.suppliesFulfilment === "Either is okay")
        return true;
    } else if (type === "food") {
      if (t.subtypes.includes("Cooked meals")) return true;
      if (
        t.subtypes.includes("Food pack / rations") &&
        (d.fulfilmentMethod === "Doorstep delivery" || d.fulfilmentMethod === "Either is okay")
      )
        return true;
    } else if (type === "welfare") {
      if (d.checkMethod === "Home visit" || d.checkMethod === "Either is okay") return true;
    }
  }
  return false;
}

function StepIndicator({
  step,
  submitted,
  maxReachable,
  onStepClick,
}: {
  step: number;
  submitted: boolean;
  maxReachable: number;
  onStepClick: (n: number) => void;
}) {
  const { tx } = useApp();
  return (
    <div className="flex items-center justify-center gap-1.5">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step || (submitted && n === STEPS.length);
        const current = n === step && !done;
        const clickable = !submitted && n <= maxReachable && n !== step;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStepClick(n)}
              disabled={!clickable}
              className={`flex items-center gap-2 ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold transition-colors ${
                  current
                    ? "bg-brand text-white"
                    : done
                      ? "bg-brand/15 text-brand"
                      : "bg-app text-faint"
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : n}
              </span>
              <span
                className={`hidden text-[12.5px] sm:block ${
                  current ? "font-semibold text-ink" : "font-medium text-faint"
                }`}
              >
                {tx(label)}
              </span>
            </button>
            {n < STEPS.length && <span className="h-px w-5 bg-black/10 sm:w-8" />}
          </div>
        );
      })}
    </div>
  );
}

export default function CommunityRequest({ onExit }: { onExit: () => void }) {
  const { tx } = useApp();
  const [step, setStep] = useState(1);
  const [tasks, setTasks] = useState<DraftTasks>({});
  const [errors, setErrors] = useState<Partial<Record<SupportTypeId, Record<string, string>>>>({});
  // Prefill from the active elderly profile (postal/floor/unit + composed
  // address), so Step 3's address matches what's saved on the Profile screen.
  const [contact, setContact] = useState<ContactInfo>(() => {
    const a = ensureAddressParts(loadActiveProfile());
    return {
      caregiverName: "Chloe",
      contactNumber: "+65 8123 4567",
      contactMethod: "WhatsApp",
      email: "",
      careRecipientName: a.name.split(" ").slice(0, 2).join(" ") || shortName,
      generalArea: "Ang Mo Kio",
      address: composeAddress(a),
      postalCode: a.postalCode ?? "",
      addressLine: a.addressLine ?? "",
      floor: a.floor ?? "",
      unit: a.unit ?? "",
      accessNotes: "",
      relationship: "",
    };
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [step1Errors, setStep1Errors] = useState<SupportTypeId[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const activeEntries = useMemo(
    () =>
      (Object.entries(tasks) as [SupportTypeId, TaskState][]).filter(
        ([, t]) => t.subtypes.length > 0,
      ),
    [tasks],
  );
  // Continue is allowed once any category is ticked; emptiness is checked on Continue.
  const hasNeed = Object.keys(tasks).length > 0;
  // Address is only asked when the request involves delivery / a home visit.
  const addressRequired = needsAddress(tasks);
  // Area matters only for welfare/referral routing — and only when there's no
  // address to infer it from (supplies/food/transport are area-independent).
  const areaNeeded =
    !addressRequired &&
    (["welfare", "referral"] as SupportTypeId[]).some((t) => (tasks[t]?.subtypes.length ?? 0) > 0);

  // --- Step 1 handlers ---
  const toggleCategory = (type: SupportTypeId) => {
    setTasks((prev) => {
      const next = { ...prev };
      if (type in next) delete next[type];
      else next[type] = { subtypes: [], details: {} };
      return next;
    });
    setStep1Errors((e) => e.filter((t) => t !== type));
  };

  const toggleSubtype = (type: SupportTypeId, subtype: string) => {
    setTasks((prev) => {
      const cur = prev[type] ?? { subtypes: [], details: {} };
      const subtypes = cur.subtypes.includes(subtype)
        ? cur.subtypes.filter((s) => s !== subtype)
        : [...cur.subtypes, subtype];
      return { ...prev, [type]: { ...cur, subtypes } };
    });
    setStep1Errors((e) => e.filter((t) => t !== type));
  };

  // --- Step 2 handlers ---
  const changeDetail = (type: SupportTypeId, key: string, value: FieldValue) =>
    setTasks((prev) => {
      const cur = prev[type];
      if (!cur) return prev;
      return { ...prev, [type]: { ...cur, details: { ...cur.details, [key]: value } } };
    });

  const goToDetails = () => {
    // Every ticked category must have at least one specific need chosen.
    const empties = (Object.entries(tasks) as [SupportTypeId, TaskState][])
      .filter(([, t]) => t.subtypes.length === 0)
      .map(([type]) => type);
    if (empties.length > 0) {
      setStep1Errors(empties);
      requestAnimationFrame(() =>
        document.getElementById(`cr-cat-${empties[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      return;
    }
    setStep1Errors([]);
    setTasks((prev) => {
      const next: DraftTasks = {};
      for (const [type, t] of Object.entries(prev) as [SupportTypeId, TaskState][]) {
        if (t.subtypes.length > 0) next[type] = withDefaults(type, t);
      }
      return next;
    });
    setStep(2);
    window.scrollTo({ top: 0 });
  };

  const validate = () => {
    const errs: Partial<Record<SupportTypeId, Record<string, string>>> = {};
    for (const [type, task] of activeEntries) {
      const tmpl = getSupportTemplate(type);
      if (!tmpl) continue;
      const fieldErrs: Record<string, string> = {};
      for (const f of tmpl.fields) {
        if (!isFieldVisible(f, task.details, task.subtypes)) continue;
        if (!f.required) continue;
        const v = task.details[f.key];
        if (f.kind === "itemQuantities") {
          const arr = Array.isArray(v) ? (v as ItemQuantity[]) : [];
          const bad =
            arr.length === 0 ||
            arr.some((e) => {
              const q = String(e.quantity ?? "").trim();
              const qMissing = q === "" || Number(q) <= 0;
              const nameMissing =
                e.item === "Other essentials" && !String(e.customItem ?? "").trim();
              return qMissing || nameMissing;
            });
          if (bad) fieldErrs[f.key] = "Add a quantity";
          continue;
        }
        const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
        if (empty) {
          fieldErrs[f.key] = ["select", "radio", "multiselect", "multiselectDropdown"].includes(f.kind)
            ? "Please choose an option"
            : "Please fill this in";
        }
      }
      if (Object.keys(fieldErrs).length) errs[type] = fieldErrs;
    }
    return errs;
  };

  const validateContact = () => {
    const e: Record<string, string> = {};
    if (!contact.caregiverName.trim()) e.caregiverName = "Please add your name";
    if (!contact.contactNumber.trim()) e.contactNumber = "Please add a contact number";
    if (!contact.contactMethod.trim()) e.contactMethod = "Please choose a method";
    if (contact.contactMethod === "Email" && !contact.email.trim()) e.email = "Please add an email address";
    if (!contact.careRecipientName.trim()) e.careRecipientName = "Please add a name";
    if (addressRequired) {
      // Address is auto-filled from the postal code, so that's the field to check.
      if (!contact.postalCode.trim()) e.postalCode = "Please add a postal code";
    } else if (areaNeeded && !contact.generalArea.trim()) {
      e.generalArea = "Please choose an area";
    }
    return e;
  };

  // Step 2 (request details) → Step 3 (personal details).
  const continueFromRequest = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      let firstId: string | null = null;
      for (const [type] of activeEntries) {
        const fe = errs[type];
        if (!fe) continue;
        const tmpl = getSupportTemplate(type);
        const f = tmpl?.fields.find((field) => fe[field.key]);
        if (f) {
          firstId = fieldDomId(type, f.key);
          break;
        }
      }
      if (firstId) {
        requestAnimationFrame(() =>
          document.getElementById(firstId!)?.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
      }
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0 });
  };

  // Step 3 (personal details) → Step 4 (match & review).
  const continueFromContact = () => {
    const cErrs = validateContact();
    setContactErrors(cErrs);
    if (Object.keys(cErrs).length > 0) {
      const ck = [
        "caregiverName",
        "contactNumber",
        "contactMethod",
        "email",
        "careRecipientName",
        "generalArea",
        "address",
        "postalCode",
      ].find((k) => cErrs[k]);
      if (ck) {
        requestAnimationFrame(() =>
          document.getElementById(contactFieldId(ck))?.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
      }
      return;
    }
    setStep(4);
    window.scrollTo({ top: 0 });
  };

  // Step-indicator navigation: a step is reachable once every step before it is
  // complete — so you can jump ahead to any already-filled step, not just the next.
  const step1Valid =
    hasNeed && (Object.values(tasks) as TaskState[]).every((t) => t.subtypes.length > 0);
  const requestValid = Object.keys(validate()).length === 0;
  const contactValid = Object.keys(validateContact()).length === 0;
  let reach = 1;
  if (step1Valid) reach = 2;
  if (step1Valid && requestValid) reach = 3;
  if (step1Valid && requestValid && contactValid) reach = 4;
  const maxReachable = submitted ? STEPS.length : Math.max(step, reach);

  const goToStep = (target: number) => {
    if (submitted || target === step || target > maxReachable) return;
    // Leaving Step 1 forward → apply Step 1 field defaults before moving on.
    if (target > step && step === 1) {
      setStep1Errors([]);
      setTasks((prev) => {
        const next: DraftTasks = {};
        for (const [type, t] of Object.entries(prev) as [SupportTypeId, TaskState][]) {
          if (t.subtypes.length > 0) next[type] = withDefaults(type, t);
        }
        return next;
      });
    }
    setStep(target);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-4 pb-28 pt-5 lg:pt-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        {!submitted && (
          <button
            type="button"
            onClick={onExit}
            aria-label="Back to community help"
            className="shrink-0 text-body transition-colors hover:text-ink"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <span className="-my-2 shrink-0">
          <Mascot size={52} variant="calm" animated={false} />
        </span>
        <div className="min-w-0">
          <h1 className="text-[20px] font-extrabold leading-tight text-ink">
            {step === 1 && tx("What help do you need?")}
            {step === 2 && tx("Tell us what's needed")}
            {step === 3 && tx("Your details")}
            {step === 4 && tx("Review who can help")}
          </h1>
        </div>
      </div>

      <StepIndicator
        step={step}
        submitted={submitted}
        maxReachable={maxReachable}
        onStepClick={goToStep}
      />

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        {step === 1 && (
          <ChooseHelp
            tasks={tasks}
            incomplete={step1Errors}
            onToggleCategory={toggleCategory}
            onToggleSubtype={toggleSubtype}
          />
        )}

        {step === 2 && (
          <>
            {Object.keys(errors).length > 0 && (
              <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[13px] font-semibold text-[#b42318] ring-1 ring-danger/20">
                {tx("Please complete the highlighted fields to continue.")}
              </p>
            )}
            <DetailsForm tasks={tasks} errors={errors} onChangeDetail={changeDetail} />
          </>
        )}

        {step === 3 && (
          <>
            {Object.keys(contactErrors).length > 0 && (
              <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[13px] font-semibold text-[#b42318] ring-1 ring-danger/20">
                {tx("Please complete the highlighted fields to continue.")}
              </p>
            )}
            <ContactDetails
              contact={contact}
              errors={contactErrors}
              showAddress={addressRequired}
              showArea={areaNeeded}
              onChange={(k, v) => setContact((c) => ({ ...c, [k]: v }))}
              onAddressChange={(partial) =>
                setContact((c) => {
                  const next = { ...c, ...partial };
                  return { ...next, address: composeAddress(next) };
                })
              }
            />
          </>
        )}

        {step === 4 && (
          <ReviewMatch
            tasks={activeEntries}
            careRecipientName={contact.careRecipientName}
            linkedTopic={LINKED_TOPIC}
            contact={{
              ...contact,
              generalArea: addressRequired ? inferArea(contact.postalCode) : contact.generalArea,
            }}
            onSubmitted={() => setSubmitted(true)}
            onBack={() => setStep(3)}
            onReset={onExit}
          />
        )}
      </motion.div>

      {/* Footer nav for steps 1 & 2 (Step 3 has its own actions) */}
      {step === 1 && (
        <button
          type="button"
          disabled={!hasNeed}
          onClick={goToDetails}
          className="w-full rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors disabled:bg-[#d5d9e1] disabled:text-[#6b7280] disabled:shadow-none"
        >
          {tx("Continue")}
        </button>
      )}
      {step === 2 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 rounded-full px-4 py-3 text-[14px] font-semibold text-body hover:text-ink"
          >
            <ArrowLeft size={18} />
            {tx("Back")}
          </button>
          <button
            type="button"
            onClick={continueFromRequest}
            className="flex-1 rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm"
          >
            {tx("Continue")}
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex items-center gap-1.5 rounded-full px-4 py-3 text-[14px] font-semibold text-body hover:text-ink"
          >
            <ArrowLeft size={18} />
            {tx("Back")}
          </button>
          <button
            type="button"
            onClick={continueFromContact}
            className="flex-1 rounded-full bg-brand py-3.5 text-[15px] font-semibold text-white shadow-sm"
          >
            {tx("Continue to matching")}
          </button>
        </div>
      )}
    </div>
  );
}
