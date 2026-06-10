// Emergency contacts + the caregiver's alert message, persisted to localStorage
// so adding/deleting a contact and the drafted alert survive a reload. Same
// best-effort, SSR-guarded pattern as lib/profiles.ts: every access is wrapped
// and swallows errors (private mode / quota / SSR) — storage must never break a
// render. The caregiver starts with two seeded contacts and can add or remove
// from there; deleting down to none is respected (we don't re-seed).

import { contacts as seedContacts } from "./data";
import type { Contact } from "./types";

const CONTACTS_KEY = "orca-contacts";
const ALERT_KEY = "orca-alert-message";

/** The two contacts a caregiver starts with (Madam Tan's son + her clinic). */
export function defaultContacts(): Contact[] {
  return seedContacts.map((c) => ({ ...c }));
}

export function loadContacts(): Contact[] {
  if (typeof window === "undefined") return defaultContacts();
  try {
    const raw = window.localStorage.getItem(CONTACTS_KEY);
    if (raw === null) return defaultContacts(); // first run — seed the two contacts
    const parsed = JSON.parse(raw) as Contact[];
    return Array.isArray(parsed) ? parsed : defaultContacts();
  } catch {
    return defaultContacts();
  }
}

export function saveContacts(list: Contact[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONTACTS_KEY, JSON.stringify(list));
  } catch {
    /* storage full / disabled — ignore in the prototype */
  }
}

export function loadAlertMessage(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(ALERT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveAlertMessage(text: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ALERT_KEY, text);
  } catch {
    /* ignore */
  }
}
