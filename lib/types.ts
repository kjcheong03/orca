// Domain types for the ORCA prototype. Frontend-only — these describe the
// shape of the mock data in lib/data.ts.

export type Severity = "URGENT" | "PRECAUTIONARY" | "INFO";

export interface EmergencyMedicine {
  name: string;
  dose: string;
  instructions: string;
}

export interface Measurement {
  label: string;
  value: string;
  takenAt: string;
  status?: "normal" | "high" | "low";
}

export interface Patient {
  name: string;
  initials: string;
  sex: string;
  age: number;
  address: string;
  conditions: string[];
  emergencyMedicine: EmergencyMedicine[];
  measurements: Measurement[];
}

export interface WhyContext {
  /** Personalised explanation, e.g. why this matters for the care recipient. */
  text: string;
  /** Condition chips surfaced as the reason this advisory is relevant. */
  conditions: string[];
  sourceLabel: string; // e.g. "Official advisory · NEA"
}

export interface Advisory {
  id: string;
  /** Emoji or icon key shown in the leading tile. */
  icon: string;
  title: string;
  source: string; // e.g. "NEA"
  severity: Severity;
  /** Coloured status pill on the right, e.g. "UNHEALTHY". */
  status?: string;
  statusTone?: "warn" | "danger" | "brand";
  /** Reading shown next to the source chip, e.g. "PSI 158". */
  metric?: string;
  /** Short summary paragraph (signals tab uses this). */
  summary?: string;
  whatToDo: string[];
  updated?: string; // e.g. "Updated · 9:00 AM"
  why?: WhyContext;
}

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  source: string;
  time: string;
  /** Authority urgency, when sourced from a real broadcast. */
  urgency?: "HIGH" | "NORMAL";
  /** Per-language versions keyed by ORCA language code (zh, ms, id, tl, my).
   *  English is the base (title/body); other languages come from the authority. */
  translations?: Record<string, { title: string; body: string }>;
  /** Authority audience mode — 'all' = broadcast to every caregiver,
   *  'selected' = only to caregivers whose profile.matchedTargets overlaps
   *  with targetProfiles. Optional + defaults to 'all' for back-compat. */
  audienceMode?: 'all' | 'selected';
  /** Authority-picked profile targets (e.g. ['Diabetes','Heart']) — read from
   *  the broadcasts row's target_profiles JSONB column. */
  targetProfiles?: string[];
}

export interface Contact {
  id: string;
  initials: string;
  name: string;
  relation: string;
  phone: string;
  role: "family" | "clinic";
}

export interface CareGuide {
  id: string;
  title: string;
  group: "procedure" | "medicine";
}

export interface EmergencyReason {
  id: string;
  label: string;
  icon: string; // lucide icon key
  /** What the responder is told happened. */
  statement: string;
}

export type Language = "en" | "id" | "tl" | "my" | "zh" | "ms" | "ta";
