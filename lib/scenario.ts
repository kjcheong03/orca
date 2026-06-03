import { covidWeekly, dengueWeekly, type OutbreakPoint } from "./outbreaks";
import { patient } from "./data";

export type Hazard = "covid" | "dengue";
export type Tier = "low" | "moderate" | "high" | "veryhigh";
export type MascotMood = "calm" | "cheer" | "concerned";

/** A caregiver action; `because` ties it to the elderly profile. */
export interface Suggestion {
  text: string;
  because?: string;
}

export function moodFor(tier: Tier): MascotMood {
  // A caregiver app should never look gleeful about an outbreak — only calm
  // (normal) or concerned (elevated risk).
  return tier === "high" || tier === "veryhigh" ? "concerned" : "calm";
}

/** COVID weekly coverage — the date picker is constrained to this. */
export const dateBounds = {
  min: covidWeekly[0].date, // 2023-02-27
  max: covidWeekly[covidWeekly.length - 1].date, // 2024-02-19
};

export const defaultDate = "2023-11-13";
export const defaultHazard: Hazard = "covid";

const HAZARD = {
  covid: { name: "COVID-19", source: "MOH", series: covidWeekly, thresholds: [8000, 20000, 40000] },
  dengue: { name: "Dengue", source: "NEA · MOH", series: dengueWeekly, thresholds: [250, 600, 1200] },
} as const;

function nearestIndex(series: OutbreakPoint[], t: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < series.length; i++) {
    const d = Math.abs(Date.parse(series[i].date) - t);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function tierOf(hazard: Hazard, cases: number): Tier {
  const [a, b, c] = HAZARD[hazard].thresholds;
  if (cases >= c) return "veryhigh";
  if (cases >= b) return "high";
  if (cases >= a) return "moderate";
  return "low";
}

export const tierLabel: Record<Tier, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  veryhigh: "Very high",
};

export type TrendDir = "rising" | "easing" | "steady";

export interface Scenario {
  hazard: Hazard;
  name: string;
  source: string;
  /** the actual data week shown (may differ from the requested date) */
  friendlyDate: string;
  /** the date the user picked */
  requestedFriendly: string;
  /** true when the picked date has no data for this hazard (showing nearest) */
  nearest: boolean;
  point: OutbreakPoint;
  tier: Tier;
  trendPct: number | null;
  trendDir: TrendDir;
  headline: string;
  elderlyStat: string;
  suggestions: Suggestion[];
  why: string;
  mascot: MascotMood;
}

function fmt(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getScenario(hazard: Hazard, dateStr: string): Scenario {
  const t = Date.parse(dateStr + "T00:00:00");
  const series = HAZARD[hazard].series;
  const idx = nearestIndex(series, t);
  const point = series[idx];
  const prev = idx > 0 ? series[idx - 1] : null;
  const tier = tierOf(hazard, point.cases);
  const friendlyDate = fmt(point.date);
  const nearest = Math.abs(Date.parse(point.date + "T00:00:00") - t) > 10 * 86_400_000;

  const trendPct =
    prev && prev.cases > 0
      ? Math.round(((point.cases - prev.cases) / prev.cases) * 100)
      : null;
  const trendDir: TrendDir =
    trendPct === null ? "steady" : trendPct > 5 ? "rising" : trendPct < -5 ? "easing" : "steady";

  return {
    hazard,
    name: HAZARD[hazard].name,
    source: HAZARD[hazard].source,
    friendlyDate,
    requestedFriendly: fmt(dateStr),
    nearest,
    point,
    tier,
    trendPct,
    trendDir,
    headline: headlineFor(hazard, tier, trendDir),
    elderlyStat: elderlyStatFor(hazard, point),
    suggestions: suggestionsFor(hazard, tier),
    why: whyFor(hazard),
    mascot: moodFor(tier),
  };
}

// ---------------------------------------------------------------------------
// Copy — profile-aware (Madam Tan, 78, hypertension + Type 2 Diabetes)
// ---------------------------------------------------------------------------
function headlineFor(hazard: Hazard, tier: Tier, dir: TrendDir): string {
  const level =
    tier === "veryhigh" ? "very high" : tier === "high" ? "high" : tier === "moderate" ? "elevated" : "low";
  const move = dir === "rising" ? "and rising" : dir === "easing" ? "but easing" : "and steady";
  const name = HAZARD[hazard].name;
  return `${name} activity is ${level} ${move}.`;
}

function elderlyStatFor(hazard: Hazard, p: OutbreakPoint): string {
  if (hazard === "covid") {
    const h = Math.round(p.seniorHosp ?? 0);
    const icu = Math.round(p.seniorIcu ?? 0);
    return `${h} daily hospitalisations · ${icu} in ICU`;
  }
  return "Older adults face a higher risk of severe dengue.";
}

function whyFor(hazard: Hazard): string {
  const who = `At ${patient.age} with ${patient.conditions.join(" and ")},`;
  if (hazard === "covid") {
    return `${who} COVID-19 is far more likely to need hospital or ICU care.`;
  }
  return `${who} dengue can hit harder — higher bleeding risk and sudden blood-pressure drops.`;
}

const SUGGESTIONS: Record<Hazard, Record<Tier, Suggestion[]>> = {
  covid: {
    low: [
      { text: "Keep her COVID-19 and flu boosters up to date.", because: "Age 78" },
      { text: "Carry on normally — watch for fever, cough or breathlessness." },
      { text: "Keep a couple of ART kits and her regular medicines on hand." },
    ],
    moderate: [
      { text: "Have her wear a mask in crowded or enclosed indoor places." },
      { text: "Keep ART kits at home and test at the first sign of symptoms." },
      { text: "Confirm her booster is current — older adults benefit the most.", because: "Age 78" },
      { text: "Keep her blood sugar steady — fevers can spike glucose.", because: "Type 2 Diabetes" },
    ],
    high: [
      { text: "Minimise non-essential outings; use an N95 mask when she goes out." },
      { text: "Test early and isolate her from the household if symptomatic." },
      { text: "Check her temperature and breathing daily; watch for chest tightness.", because: "Hypertension" },
      { text: "Have a teleconsult option and 5 days of medicines ready." },
    ],
    veryhigh: [
      { text: "Avoid visitors and crowded places wherever possible." },
      { text: "N95 mask for any unavoidable outing; keep her room ventilated." },
      { text: "Monitor breathing and SpO2 daily.", because: "Hypertension · Diabetes" },
      { text: "Know the 995 red flags: breathlessness, confusion, chest pain." },
    ],
  },
  dengue: {
    low: [
      { text: "Do the 5-step Mozzie Wipeout weekly — clear any stagnant water." },
      { text: "Apply repellent on her, especially at dawn and dusk." },
      { text: "Watch for fever with body aches or rash." },
    ],
    moderate: [
      { text: "Remove stagnant water around the home (vases, trays, drains)." },
      { text: "Apply repellent and keep her arms and legs covered." },
      { text: "For fever, use paracetamol — avoid ibuprofen/NSAIDs.", because: "Bleeding risk" },
      { text: "See a doctor early for any fever — don't wait it out." },
    ],
    high: [
      { text: "Step up mosquito control; use repellent and a bed net for her." },
      { text: "For fever, use paracetamol — avoid ibuprofen/NSAIDs.", because: "Bleeding risk" },
      { text: "Seek care early for fever — older adults can deteriorate fast.", because: "Age 78" },
      { text: "Watch for bleeding gums, severe tummy pain or drowsiness." },
    ],
    veryhigh: [
      { text: "Treat this as an active outbreak — check daily for standing water." },
      { text: "Repellent, long sleeves and a bed net for her at all times." },
      { text: "Any fever → see a doctor; flag her bleeding and BP risk.", because: "Hypertension" },
      { text: "Severe abdominal pain, bleeding or fainting → go to A&E." },
    ],
  },
};

function suggestionsFor(hazard: Hazard, tier: Tier): Suggestion[] {
  return SUGGESTIONS[hazard][tier];
}
