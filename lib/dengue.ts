import { dengueClusters, dengueSnapshotDate, type DengueCluster } from "./dengueClusters";
import { patient } from "./data";
import { moodFor, tierLabel, type MascotMood, type Suggestion, type Tier } from "./scenario";

// Madam Tan's home — Blk 123 Ang Mo Kio Ave 6 (approx).
export const HOME = { area: "Ang Mo Kio", lat: 1.3699, lng: 103.8475 };

export interface NearbyCluster extends DengueCluster {
  distanceKm: number;
}

export interface DengueScenario {
  area: string;
  snapshotDate: string;
  clusters: NearbyCluster[]; // all, sorted by distance
  nearest: NearbyCluster | null;
  activeClusters: number;
  totalCases: number;
  tier: Tier;
  tierLabel: string;
  headline: string;
  suggestions: Suggestion[];
  why: string;
  mascot: MascotMood;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const p = Math.PI / 180;
  const x =
    0.5 -
    Math.cos((bLat - aLat) * p) / 2 +
    (Math.cos(aLat * p) * Math.cos(bLat * p) * (1 - Math.cos((bLng - aLng) * p))) / 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function tierOf(nearest: NearbyCluster | null): Tier {
  if (!nearest) return "low";
  const { distanceKm, cases } = nearest;
  if (distanceKm <= 1 && cases >= 10) return "veryhigh";
  if (distanceKm <= 1) return "high";
  if (distanceKm <= 3) return "moderate";
  if (distanceKm <= 5) return "moderate";
  return "low";
}

export function getDengueScenario(): DengueScenario {
  const clusters: NearbyCluster[] = dengueClusters
    .map((c) => ({ ...c, distanceKm: Math.round(haversineKm(HOME.lat, HOME.lng, c.lat, c.lng) * 10) / 10 }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearest = clusters[0] ?? null;
  const tier = tierOf(nearest);
  const totalCases = clusters.reduce((s, c) => s + c.cases, 0);

  return {
    area: HOME.area,
    snapshotDate: dengueSnapshotDate,
    clusters,
    nearest,
    activeClusters: clusters.length,
    totalCases,
    tier,
    tierLabel: tierLabel[tier],
    headline: headlineFor(tier, nearest),
    suggestions: suggestionsFor(tier),
    why: `At ${patient.age} with ${patient.conditions.join(" and ")}, dengue can hit harder — higher bleeding risk and sudden blood-pressure drops.`,
    mascot: moodFor(tier),
  };
}

function headlineFor(tier: Tier, nearest: NearbyCluster | null): string {
  if (!nearest) return "No active dengue clusters near home.";
  if (tier === "high" || tier === "veryhigh") return "An active dengue cluster is very close to home.";
  if (tier === "moderate") return `Dengue clusters are active near ${HOME.area}.`;
  return "No dengue clusters close to home right now.";
}

function suggestionsFor(tier: Tier): Suggestion[] {
  if (tier === "high" || tier === "veryhigh") {
    return [
      { text: "A cluster is right around the home — do the 5-step Mozzie Wipeout today." },
      { text: "Repellent and long sleeves for her, especially at dawn and dusk." },
      { text: "For fever, use paracetamol — avoid ibuprofen/NSAIDs.", because: "Bleeding risk" },
      { text: "Any fever → see a doctor early.", because: "Age 78" },
    ];
  }
  if (tier === "moderate") {
    return [
      { text: "Clusters are nearby — clear standing water around the home weekly." },
      { text: "Apply repellent on her, especially at dawn and dusk." },
      { text: "For fever, use paracetamol — avoid ibuprofen/NSAIDs.", because: "Bleeding risk" },
      { text: "See a doctor early for any fever — don't wait it out.", because: "Age 78" },
    ];
  }
  return [
    { text: "No clusters close by — keep up the weekly Mozzie Wipeout." },
    { text: "Apply repellent when she's outdoors near greenery." },
    { text: "Watch for fever; older adults can develop severe dengue." },
  ];
}
