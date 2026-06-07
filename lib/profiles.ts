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
  /** Pre-computed Target categories from conditions[], cached so the broadcast
   *  filter doesn't have to re-classify on every fetch. Empty array means
   *  classification hasn't run yet (or all conditions were unclassifiable). */
  matchedTargets?: string[];
  /** Per-target original-condition strings that caused each Target to match.
   *  Used to display the SPECIFIC patient condition (e.g. "Type 2 Diabetes")
   *  on tailored cards instead of the controlled Target name ("Diabetes"). */
  matchedTargetReasons?: Record<string, string[]>;
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

/**
 * One-time migration: the app was formerly named "CARA". Carry over any
 * locally-saved data from the old "cara-*" localStorage keys to the new
 * "orca-*" keys so existing users keep their data after the rename.
 */
function migrateLegacyKey(oldKey: string, newKey: string): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(newKey) !== null) return; // already on the new key
    const legacy = window.localStorage.getItem(oldKey);
    if (legacy === null) return;
    window.localStorage.setItem(newKey, legacy);
    window.localStorage.removeItem(oldKey);
  } catch {
    /* ignore in the prototype */
  }
}

const KEY = "orca-elder-profiles";

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
      matchedTargets: ["Heart", "Diabetes"],
      matchedTargetReasons: { Heart: ["Hypertension"], Diabetes: ["Type 2 Diabetes"] },
    },
  ];
}

export function loadProfiles(): ElderProfile[] {
  if (typeof window === "undefined") return defaultProfiles();
  migrateLegacyKey("cara-elder-profiles", KEY);
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
const ACTIVE_KEY = "orca-active-elder";

export function loadActiveId(): string {
  if (typeof window === "undefined") return "p-default";
  migrateLegacyKey("cara-active-elder", ACTIVE_KEY);
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

const CAREGIVER_KEY = "orca-caregiver";

/** Mock defaults — the same caregiver we use throughout the prototype. */
export function defaultCaregiver(): CaregiverProfile {
  return { name: "Chloe", contactNumber: "+65 8123 4567", email: "demo@orca.sg" };
}

export function loadCaregiver(): CaregiverProfile {
  if (typeof window === "undefined") return defaultCaregiver();
  migrateLegacyKey("cara-caregiver", CAREGIVER_KEY);
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
    matchedTargets: [],
    matchedTargetReasons: {},
  };
}

/**
 * Classify a profile's conditions[] against the controlled Target vocabulary
 * by calling the server endpoint, and return a copy of the profile with
 * `matchedTargets` updated. Permissive failure mode: on any error (network,
 * non-OK status, parse failure) the profile is returned unchanged so the
 * previous matchedTargets stays intact. The caller decides whether to persist
 * the result via saveProfiles.
 */
export async function classifyAndSaveProfile(profile: ElderProfile): Promise<ElderProfile> {
  try {
    const res = await fetch("/api/profile/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions: profile.conditions }),
    });
    if (!res.ok) return profile;
    const data = (await res.json()) as {
      matchedTargets?: unknown;
      matchedTargetReasons?: unknown;
    };
    if (!Array.isArray(data.matchedTargets)) return profile;
    const matchedTargets = data.matchedTargets.filter((t): t is string => typeof t === "string");
    const rawReasons =
      data.matchedTargetReasons && typeof data.matchedTargetReasons === "object" && !Array.isArray(data.matchedTargetReasons)
        ? (data.matchedTargetReasons as Record<string, unknown>)
        : {};
    const matchedTargetReasons: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(rawReasons)) {
      if (Array.isArray(v)) {
        matchedTargetReasons[k] = v.filter((s): s is string => typeof s === "string");
      }
    }
    return { ...profile, matchedTargets, matchedTargetReasons };
  } catch {
    return profile;
  }
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
