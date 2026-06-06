// Source-keyed translation layer.
//
// Every user-facing English string in the app is the KEY; the value holds the
// translation for each non-English language. `tx(lang, s)` looks it up; English
// (or any miss) falls back to the original text, so the app never renders blank.
//
// Translations are authored by hand in lib/i18n/dict/* and merged here.

import type { Language } from "../types";
import type { Dict } from "./dict/types";
import { chrome } from "./dict/chrome";
import { content } from "./dict/content";
import { community } from "./dict/community";

const DICTIONARY: Dict = { ...chrome, ...content, ...community };

/** Translate an English source string to the active language (fallback: source). */
export function tx(lang: Language, s: string): string {
  if (lang === "en" || !s) return s;
  return DICTIONARY[s]?.[lang] ?? s;
}

/**
 * Translate a templated string, then fill {placeholders}. The TEMPLATE (with
 * its {tokens}) is what lives in the dictionary, so word order can change per
 * language while names/numbers stay verbatim.
 *   txf(lang, "For {name} today", { name: "Madam Tan" })
 */
export function txf(
  lang: Language,
  template: string,
  params: Record<string, string | number>,
): string {
  let out = tx(lang, template);
  for (const [k, v] of Object.entries(params)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}
