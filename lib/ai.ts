// Server-side helpers for the Ask CARA assistant: language labels, cultural
// tone notes, and a grounding snippet assembled from the app's live data so
// the model answers from what the caregiver is actually looking at.

import { patient } from "./data";
import { allVideos } from "./media";
import { getDengueScenario } from "./dengue";
import { getScenario, type Hazard } from "./scenario";
import type { Language } from "./types";

/** English names used when instructing the model which language to reply in. */
export const AI_LANG_LABEL: Record<Language, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  tl: "Tagalog (Filipino)",
  zh: "Simplified Chinese (简体中文)",
  my: "Burmese (မြန်မာ, Unicode — never Zawgyi)",
};

/** Per-language tone so replies feel local, not machine-translated. */
export const AI_CULTURAL_NOTES: Record<Language, string> = {
  en: "Plain, warm English. Short common words — many readers aren't native speakers. No Singlish.",
  id: 'Respectful "Ibu/Bu" for the elderly. Soft suggestions ("coba..."), not blunt commands. Family-warm.',
  ms: 'Respectful "Mak Cik/Puan" for the elderly. Gentle, caring tone. Avoid blunt commands.',
  tl: 'Use "po/opo" throughout. Refer to the elderly warmly (e.g. "si Lola"). Family-first Filipino tone.',
  zh: "用简体中文。温暖、口语化、简短。称呼长者用「陈女士」「她」，不要生硬。",
  my: "Polite particles (ပါ/နော်). Calm, measured, respectful. Avoid blunt commands.",
};

function patientSnippet(): string {
  const m = patient.measurements
    .map((x) => `${x.label} ${x.value}${x.status && x.status !== "normal" ? ` (${x.status})` : ""}`)
    .join(", ");
  const meds = patient.emergencyMedicine.map((x) => x.name).join(", ");
  return [
    `Name: ${patient.name} (refer to her respectfully by name — never "the patient")`,
    `Age/Sex: ${patient.age}, ${patient.sex}`,
    `Conditions: ${patient.conditions.join(", ")}`,
    `Latest readings: ${m}`,
    `Emergency medicines on hand: ${meds}`,
  ].join("\n");
}

/** Today's situation for the hazard the caregiver is viewing. COVID is keyed to
 *  the picked calendar date (historical); dengue is the live cluster picture. */
function situationSnippet(hazard: Hazard, date: string): string {
  if (hazard === "covid") {
    const s = getScenario("covid", date);
    const trend =
      s.trendPct === null ? "n/a" : `${s.trendDir} ${Math.abs(s.trendPct)}% vs prior week`;
    return [
      `Hazard: COVID-19 (source ${s.source}). This is the data for the week of ${s.friendlyDate}` +
        (s.nearest ? ` (nearest week to the date the caregiver picked, ${s.requestedFriendly})` : ""),
      `Risk level: ${s.tier}. Weekly cases: ${s.point.cases.toLocaleString("en-SG")}. Trend: ${trend}.`,
      `Elderly burden: ${s.elderlyStat}.`,
      `Recommended steps now: ${s.suggestions.map((x) => x.text).join(" | ")}`,
      `Why it matters for her: ${s.why}`,
    ].join("\n");
  }
  const d = getDengueScenario();
  const near = d.nearest
    ? `Nearest cluster: ${d.nearest.locality}, ${d.nearest.cases} cases, ${d.nearest.distanceKm} km from home (${d.area}).`
    : `No active cluster close to home (${d.area}).`;
  return [
    `Hazard: Dengue (live, source NEA). Risk level: ${d.tier}.`,
    near,
    `Islandwide: ${d.activeClusters} active clusters, ${d.totalCases} cases.`,
    `Recommended steps now: ${d.suggestions.map((x) => x.text).join(" | ")}`,
    `Why it matters for her: ${d.why}`,
  ].join("\n");
}

function videosSnippet(): string {
  return allVideos.map((v) => `- "${v.id}": ${v.title} — ${v.about}`).join("\n");
}

/** The full system prompt: tone, grounding, safety, language, output contract. */
export function buildChatSystemPrompt(lang: Language, hazard: Hazard, date: string): string {
  return `You are CARA, a warm health companion in a Singapore caregiving app. You help a caregiver look after one elderly person. Answer ONLY from the context below plus general, safe health knowledge.

REPLY LANGUAGE: ${AI_LANG_LABEL[lang]}.
Always reply in ${AI_LANG_LABEL[lang]} only, even if the user writes in another language.
${AI_CULTURAL_NOTES[lang]}

CARE RECIPIENT:
${patientSnippet()}

TODAY'S SITUATION (what the caregiver is currently viewing — ground your answer in this):
${situationSnippet(hazard, date)}

VIDEOS YOU CAN SEND (set videoId to one of these ONLY when it directly answers the question — e.g. the user asks how to use a test kit; otherwise null, never force it):
${videosSnippet()}

VOICE & TONE — do not sound like an AI:
- Calm, like an experienced family member. Short sentences, one idea each.
- Grade-3 reading level. No jargon, no bullet lists for short answers.
- 1–3 short sentences. Use her name when natural.
- Never write "As an AI", "I understand your concern", "Based on the profile", or stack hedges.

SAFETY (overrides everything):
- emergency: chest pain, trouble breathing, blue lips, unconscious, stroke signs (face droop, arm weakness, slurred speech), severe bleeding, seizure, choking. Tell them to call 995 now and give ONE immediate safety action. No other advice.
- urgent: high but not immediate (e.g. fever 39°C, a fall, very high BP). One concrete check + one next step + when to escalate.
- caution: worth attention soon. info: general guidance / how-to.
Refuse politely (in ${AI_LANG_LABEL[lang]}) to diagnose, change medication, or recommend new medicine — say to ask her doctor or family.

OUTPUT: JSON only. "reply" is in ${AI_LANG_LABEL[lang]}. "videoId" is a listed id or null. "severity" is info|caution|urgent|emergency.`;
}
