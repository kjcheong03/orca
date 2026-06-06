// Editable elderly care-recipient profiles (frontend prototype).
//
// One caregiver can look after several elderly people, so the Profile screen
// keeps a list of profiles and persists edits to localStorage. The first
// profile is seeded from the static demo patient. (Other screens still read the
// static `patient` for now — wiring the active profile app-wide is a follow-up.)

import { patient } from "./data";
import type { EmergencyMedicine } from "./types";

export interface ElderProfile {
  id: string;
  name: string;
  sex: string;
  age: string; // string so the field can be cleared while editing
  /** Full, display-ready address — composed from the parts below on save. */
  address: string;
  // Structured address parts (edited via the postal-code OneMap lookup).
  postalCode?: string;
  addressLine?: string; // block + street (+ building), e.g. "Blk 123 Ang Mo Kio Ave 6"
  floor?: string;
  unit?: string;
  conditions: string[];
  emergencyMedicine: EmergencyMedicine[];
  notes: string[];
}

/** Combine the address parts into one display string. */
export function composeAddress(p: {
  addressLine?: string;
  floor?: string;
  unit?: string;
  postalCode?: string;
  address?: string;
}): string {
  const unitPart = p.floor ? `#${p.floor}${p.unit ? `-${p.unit}` : ""}` : "";
  const parts = [p.addressLine?.trim(), unitPart, p.postalCode?.trim() ? `Singapore ${p.postalCode.trim()}` : ""].filter(
    Boolean,
  );
  return parts.length ? parts.join(", ") : (p.address ?? "").trim();
}

/** Best-effort split of a full address back into editable parts. */
export function parseAddress(full: string): Pick<ElderProfile, "addressLine" | "floor" | "unit" | "postalCode"> {
  const postalCode = full.match(/\b(\d{6})\b/)?.[1] ?? "";
  const unit = full.match(/#\s*([0-9A-Za-z]+)\s*-\s*([0-9A-Za-z]+)/);
  const addressLine = full
    .replace(/,?\s*#\s*[0-9A-Za-z]+\s*-\s*[0-9A-Za-z]+/, "")
    .replace(/,?\s*Singapore\s*\d{6}\s*$/i, "")
    .replace(/,?\s*\d{6}\s*$/, "")
    .replace(/,\s*$/, "")
    .trim();
  return { addressLine, floor: unit?.[1] ?? "", unit: unit?.[2] ?? "", postalCode };
}

/** Fill the structured parts from `address` if they're not set yet (older saves). */
export function ensureAddressParts(p: ElderProfile): ElderProfile {
  if (p.addressLine || p.postalCode || p.floor || p.unit) return p;
  return { ...p, ...parseAddress(p.address ?? "") };
}

const KEY = "cara-elder-profiles";

// Caregiver notes that used to live in the Profile screen.
export const DEFAULT_NOTES = [
  "Prefers Mandarin; limited English.",
  "Lives alone; daughter visits on weekends.",
  "Walks with a cane — avoid stairs where possible.",
  "Spare keys kept with the neighbour at #08-43.",
];

export function defaultProfiles(): ElderProfile[] {
  return [
    {
      id: "p-default",
      name: patient.name,
      sex: patient.sex,
      age: String(patient.age),
      address: patient.address,
      postalCode: "560123",
      addressLine: "Blk 123 Ang Mo Kio Ave 6",
      floor: "08",
      unit: "45",
      conditions: [...patient.conditions],
      emergencyMedicine: patient.emergencyMedicine.map((m) => ({ ...m })),
      notes: [...DEFAULT_NOTES],
    },
  ];
}

export function loadProfiles(): ElderProfile[] {
  if (typeof window === "undefined") return defaultProfiles();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultProfiles();
    const parsed = JSON.parse(raw) as ElderProfile[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultProfiles();
  } catch {
    return defaultProfiles();
  }
}

export function saveProfiles(profiles: ElderProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profiles));
  } catch {
    /* storage full / disabled — ignore in the prototype */
  }
}

// --- active profile (the elderly currently selected on the Profile screen) ---
// Persisted so other screens (e.g. Contacts) can show / send the same person.
// (A shared store is the cleaner long-term home — that's the backend wiring.)
const ACTIVE_KEY = "cara-active-elder";

export function loadActiveId(): string {
  if (typeof window === "undefined") return "p-default";
  try {
    return window.localStorage.getItem(ACTIVE_KEY) || "p-default";
  } catch {
    return "p-default";
  }
}

export function saveActiveId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}

/** The currently-selected elderly profile (falls back to the first). */
export function loadActiveProfile(): ElderProfile {
  const profiles = loadProfiles();
  const id = loadActiveId();
  return profiles.find((p) => p.id === id) ?? profiles[0];
}

// --- caregiver (the person submitting requests) -----------------------------
// Their own name + contact, prefilled into the community request form. Only the
// name is required; contact details are optional. Stored locally (prototype).

export interface CaregiverProfile {
  name: string;
  contactNumber: string;
  email: string;
}

const CAREGIVER_KEY = "cara-caregiver";

/** Mock defaults — the same caregiver we use throughout the prototype. */
export function defaultCaregiver(): CaregiverProfile {
  return { name: "Chloe", contactNumber: "+65 8123 4567", email: "demo@orca.sg" };
}

export function loadCaregiver(): CaregiverProfile {
  if (typeof window === "undefined") return defaultCaregiver();
  try {
    const raw = window.localStorage.getItem(CAREGIVER_KEY);
    if (!raw) return defaultCaregiver();
    return { ...defaultCaregiver(), ...(JSON.parse(raw) as Partial<CaregiverProfile>) };
  } catch {
    return defaultCaregiver();
  }
}

export function saveCaregiver(c: CaregiverProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CAREGIVER_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function blankMedicine(): EmergencyMedicine {
  return { name: "", dose: "", instructions: "" };
}

export function blankProfile(id: string): ElderProfile {
  return {
    id,
    name: "",
    sex: "Female",
    age: "",
    address: "",
    conditions: [],
    emergencyMedicine: [],
    notes: [],
  };
}

/** Up-to-two-letter initials for the switcher avatar. */
export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
