"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { translate } from "@/lib/i18n";
import { tx as txAuto, txf as txfAuto } from "@/lib/i18n/auto";
import { broadcasts as seedBroadcasts } from "@/lib/data";
import { loadBroadcasts } from "@/lib/broadcasts";
import type { Broadcast, Language } from "@/lib/types";

export type Tab = "info" | "support" | "contacts" | "profile";

interface AppState {
  tab: Tab;
  setTab: (tab: Tab) => void;

  lang: Language;
  setLang: (lang: Language) => void;
  /** Translate a key using the current language (with English fallback). */
  t: (key: string) => string;
  /** Translate an English source string using the current language. */
  tx: (s: string) => string;
  /** Translate a templated string, then fill {placeholders}. */
  txf: (template: string, params: Record<string, string | number>) => string;

  langPickerOpen: boolean;
  openLangPicker: () => void;
  closeLangPicker: () => void;

  broadcastOpen: boolean;
  openBroadcast: () => void;
  closeBroadcast: () => void;

  /** Broadcasts shown in the banner + sheet. Live authority broadcasts when
   *  available, otherwise the bundled seed copy. Newest first. */
  broadcasts: Broadcast[];
  /** The headline broadcast for the top banner (the latest one). */
  bannerBroadcast: { title: string; preview: string };
}

const AppContext = createContext<AppState | null>(null);

/** One-line preview of a broadcast body for the banner. */
function previewOf(body: string): string {
  const clean = body.replace(/\s+/g, " ").trim();
  return clean.length > 90 ? `${clean.slice(0, 89).trimEnd()}…` : clean;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("info");
  const [lang, setLang] = useState<Language>("en");
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  // Live authority broadcasts. A genuine empty result ([]) is shown as an empty
  // state (no stale mock). The bundled seed copy is used ONLY when the fetch
  // FAILS, so a transient outage never blanks the banner.
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  useEffect(() => {
    let active = true;
    loadBroadcasts()
      .then((fetched) => {
        if (active) setBroadcasts(fetched);
      })
      .catch(() => {
        if (active) setBroadcasts(seedBroadcasts);
      });
    return () => {
      active = false;
    };
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);
  const tx = useCallback((s: string) => txAuto(lang, s), [lang]);
  const txf = useCallback(
    (template: string, params: Record<string, string | number>) => txfAuto(lang, template, params),
    [lang],
  );

  const value = useMemo<AppState>(() => {
    const top = broadcasts[0];
    const topContent = top
      ? (lang !== "en" && top.translations?.[lang] ? top.translations[lang] : { title: top.title, body: top.body })
      : null;
    const bannerBroadcast = topContent
      ? { title: topContent.title, preview: previewOf(topContent.body) }
      : { title: "", preview: "" };
    return {
      tab,
      setTab,
      lang,
      setLang,
      t,
      tx,
      txf,
      langPickerOpen,
      openLangPicker: () => setLangPickerOpen(true),
      closeLangPicker: () => setLangPickerOpen(false),
      broadcastOpen,
      openBroadcast: () => setBroadcastOpen(true),
      closeBroadcast: () => setBroadcastOpen(false),
      broadcasts,
      bannerBroadcast,
    };
  }, [tab, lang, t, tx, txf, langPickerOpen, broadcastOpen, broadcasts]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
