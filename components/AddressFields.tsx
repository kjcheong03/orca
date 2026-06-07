"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { isOffline } from "@/lib/online";

export interface AddressValue {
  postalCode?: string;
  addressLine?: string;
  floor?: string;
  unit?: string;
}

const INPUT =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-brand";

// Default label style matches the Profile editor. Other screens (e.g. the
// community form) pass their own via `labelClass` so it blends in.
const PROFILE_LABEL = "text-[12px] font-bold uppercase tracking-wider text-faint";

function Label({
  children,
  required,
  className,
}: {
  children: React.ReactNode;
  required?: boolean;
  className: string;
}) {
  return (
    <label className={`mb-1.5 flex items-center gap-1 ${className}`}>
      {children}
      {required && <span className="text-danger">*</span>}
    </label>
  );
}

/**
 * Postal code (OneMap auto-fills the street) + optional floor & unit, with the
 * full composed address previewed below. Shared by the Profile editor and the
 * community support form so they behave identically.
 */
export default function AddressFields({
  value,
  onChange,
  required,
  error,
  postalId,
  labelClass = PROFILE_LABEL,
}: {
  value: AddressValue;
  onChange: (partial: AddressValue) => void;
  required?: boolean;
  /** Validation error to show in place of the preview (e.g. "Please add a postal code"). */
  error?: string;
  /** id on the postal field wrapper, so a form can scroll to it. */
  postalId?: string;
  /** Override the label typography to match the host form. */
  labelClass?: string;
}) {
  const { tx } = useApp();
  const [lookup, setLookup] = useState<"idle" | "loading" | "done" | "error" | "offline">("idle");

  const onPostal = async (raw: string) => {
    const postal = raw.replace(/\D/g, "").slice(0, 6);
    onChange({ postalCode: postal });
    if (postal.length !== 6) {
      setLookup("idle");
      return;
    }
    // Offline: the OneMap lookup can't run. Let the user type the street in.
    if (isOffline()) {
      setLookup("offline");
      return;
    }
    setLookup("loading");
    try {
      const res = await fetch(`/api/onemap?postal=${postal}`);
      const data = (await res.json()) as { found?: boolean; addressLine?: string };
      if (data.found && data.addressLine) {
        onChange({ addressLine: data.addressLine });
        setLookup("done");
      } else {
        onChange({ addressLine: "" }); // don't keep a stale street for a new postal
        setLookup("error");
      }
    } catch {
      setLookup("error");
    }
  };

  const postalBorder = error ? "border-danger" : "border-black/10";

  return (
    <div className="space-y-3">
      {/* Postal code — the lookup key; auto-fills the block & street below. */}
      <div id={postalId} className="scroll-mt-24">
        <Label
          required={required}
          className={error ? labelClass.replace(/text-(faint|ink)/, "text-danger") : labelClass}
        >
          {tx("Postal code")}
        </Label>
        <div className="relative">
          <input
            value={value.postalCode ?? ""}
            onChange={(e) => onPostal(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="560123"
            className={`${INPUT} ${postalBorder}`}
          />
          {lookup === "loading" && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-faint" />
          )}
          {lookup === "done" && (
            <Check size={16} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a8f5e]" />
          )}
        </div>
      </div>

      {/* Block & street — auto-filled from the postal code (above), but editable so
          users can correct it or type it in when the lookup can't find their address. */}
      <div>
        <Label required={required} className={labelClass}>{tx("Block & street")}</Label>
        <input
          value={value.addressLine ?? ""}
          onChange={(e) => onChange({ addressLine: e.target.value })}
          placeholder={tx("Auto-filled from postal code")}
          className={`${INPUT} border-black/10`}
        />
      </div>

      {/* Floor & unit — entered manually; the postal code can't derive these. */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label className={labelClass}>{tx("Floor")}</Label>
          <input
            value={value.floor ?? ""}
            onChange={(e) => onChange({ floor: e.target.value })}
            inputMode="numeric"
            placeholder="08"
            className={`${INPUT} border-black/10`}
          />
        </div>
        <div className="flex-1">
          <Label className={labelClass}>{tx("Unit")}</Label>
          <input
            value={value.unit ?? ""}
            onChange={(e) => onChange({ unit: e.target.value })}
            placeholder="45"
            className={`${INPUT} border-black/10`}
          />
        </div>
      </div>

      {lookup === "error" ? (
        <p className="text-[12px] font-medium text-danger">
          {tx("Couldn't find that postal code — please enter your block & street above.")}
        </p>
      ) : lookup === "offline" ? (
        <p className="text-[12px] font-medium text-faint">
          {tx("You're offline — please enter your block & street above.")}
        </p>
      ) : error ? (
        <p className="text-[12px] font-medium text-danger">{error}</p>
      ) : null}
    </div>
  );
}
