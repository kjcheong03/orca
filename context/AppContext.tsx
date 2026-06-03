"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { translate } from "@/lib/i18n";
import type { Language } from "@/lib/types";

export type Tab = "info" | "support" | "contacts" | "profile";

interface AppState {
  tab: Tab;
  setTab: (tab: Tab) => void;

  lang: Language;
  setLang: (lang: Language) => void;
  /** Translate a key using the current language (with English fallback). */
  t: (key: string) => string;

  langPickerOpen: boolean;
  openLangPicker: () => void;
  closeLangPicker: () => void;

  broadcastOpen: boolean;
  openBroadcast: () => void;
  closeBroadcast: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("info");
  const [lang, setLang] = useState<Language>("en");
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  const value = useMemo<AppState>(
    () => ({
      tab,
      setTab,
      lang,
      setLang,
      t,
      langPickerOpen,
      openLangPicker: () => setLangPickerOpen(true),
      closeLangPicker: () => setLangPickerOpen(false),
      broadcastOpen,
      openBroadcast: () => setBroadcastOpen(true),
      closeBroadcast: () => setBroadcastOpen(false),
    }),
    [tab, lang, t, langPickerOpen, broadcastOpen],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
