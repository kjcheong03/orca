"use client";

import AddressFields, { type AddressValue } from "@/components/AddressFields";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useApp } from "@/context/AppContext";
import { CONTACT_METHODS, SG_AREAS } from "@/lib/community";

export interface ContactInfo {
  caregiverName: string;
  contactNumber: string;
  contactMethod: string;
  email: string;
  careRecipientName: string;
  generalArea: string;
  /** Composed full address (built from the parts below). */
  address: string;
  postalCode: string;
  addressLine: string;
  floor: string;
  unit: string;
  accessNotes: string;
  relationship: string;
}

export const contactFieldId = (key: string) => `cr-contact-${key}`;

const inputBase =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-brand";

export default function ContactDetails({
  contact,
  errors,
  showAddress,
  showArea,
  onChange,
  onAddressChange,
}: {
  contact: ContactInfo;
  errors: Record<string, string>;
  showAddress: boolean;
  showArea: boolean;
  onChange: (key: keyof ContactInfo, value: string) => void;
  onAddressChange: (partial: AddressValue) => void;
}) {
  const { tx } = useApp();
  const text = (key: keyof ContactInfo, label: string, placeholder: string, required?: boolean) => {
    const err = errors[key];
    return (
      <div id={contactFieldId(key)} className="scroll-mt-24">
        <label className={`mb-1.5 flex items-center gap-1 text-[13px] font-semibold ${err ? "text-danger" : "text-ink"}`}>
          {tx(label)}
          {required && <span className="text-danger">*</span>}
        </label>
        <input
          type="text"
          value={contact[key]}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder={tx(placeholder)}
          className={`${inputBase} ${err ? "border-danger" : "border-black/10"}`}
        />
        {err && <p className="mt-1 text-[12px] font-medium text-danger">{tx(err)}</p>}
      </div>
    );
  };

  return (
    <section className="rounded-[22px] bg-card p-5 shadow-[0_2px_14px_rgba(30,50,90,0.06)]">
      <div className="space-y-4">
        {text("caregiverName", "Your name", "e.g. Chloe", true)}
        {text("contactNumber", "Contact number", "+65 8123 4567", true)}

        <div id={contactFieldId("contactMethod")} className="scroll-mt-24">
          <label className={`mb-1.5 flex items-center gap-1 text-[13px] font-semibold ${errors.contactMethod ? "text-danger" : "text-ink"}`}>
            {tx("Preferred contact method")}
            <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTACT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange("contactMethod", m)}
                aria-pressed={contact.contactMethod === m}
                className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  contact.contactMethod === m ? "bg-brand text-white" : "bg-app text-body hover:bg-subtle"
                }`}
              >
                {tx(m)}
              </button>
            ))}
          </div>
          {errors.contactMethod && (
            <p className="mt-1 text-[12px] font-medium text-danger">{tx(errors.contactMethod)}</p>
          )}
        </div>

        {contact.contactMethod === "Email" && text("email", "Email address", "name@example.com", true)}

        {text("careRecipientName", "Care recipient's name", "e.g. Madam Tan", true)}

        {showArea && (
          <div id={contactFieldId("generalArea")} className="scroll-mt-24">
            <label className={`mb-1.5 flex items-center gap-1 text-[13px] font-semibold ${errors.generalArea ? "text-danger" : "text-ink"}`}>
              {tx("General area")}
              <span className="text-danger">*</span>
            </label>
            <SearchableSelect
              value={contact.generalArea}
              onChange={(v) => onChange("generalArea", v)}
              options={SG_AREAS}
              placeholder={tx("Select an area")}
              error={!!errors.generalArea}
            />
            <p className="mt-1 text-[12px] text-faint">{tx("Used to find partners that cover your area.")}</p>
            {errors.generalArea && <p className="mt-1 text-[12px] font-medium text-danger">{tx(errors.generalArea)}</p>}
          </div>
        )}

        {showAddress && (
          <>
            <hr className="border-black/[0.07]" />
            <AddressFields
              value={contact}
              onChange={onAddressChange}
              required
              error={errors.postalCode}
              postalId={contactFieldId("postalCode")}
              labelClass="text-[13px] font-semibold text-ink"
            />
            {text("accessNotes", "Access notes (optional)", "Gate code, lift access, etc.")}
            <p className="-mt-1.5 text-[12px] text-faint">{tx("Used for delivery and home visits.")}</p>
          </>
        )}

        {text("relationship", "Relationship to care recipient (optional)", "e.g. Daughter")}
      </div>
    </section>
  );
}
