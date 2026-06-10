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
import { readCache, saveCache } from "@/lib/offlineCache";
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

  /** True while a soft keyboard is up (an editable element is focused). The
   *  bottom nav uses this to slide out of the way on iOS/Android. */
  keyboardOpen: boolean;

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
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  // Live authority broadcasts. A genuine empty result ([]) is shown as an empty
  // state (no stale mock). The bundled seed copy is used ONLY when the fetch
  // FAILS, so a transient outage never blanks the banner.
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  useEffect(() => {
    let active = true;
    loadBroadcasts()
      .then((fetched) => {
        if (!active) return;
        setBroadcasts(fetched);
        saveCache("broadcasts", fetched); // keep a copy for offline reloads
      })
      .catch(() => {
        if (!active) return;
        // Fetch failed (often offline). Prefer the last-known broadcasts we
        // cached; only fall back to the bundled seed copy if there's no cache.
        const cached = readCache<Broadcast[]>("broadcasts");
        setBroadcasts(cached?.data?.length ? cached.data : seedBroadcasts);
      });
    return () => {
      active = false;
    };
  }, []);

  // Soft-keyboard handling for mobile browsers (iOS Safari especially, where
  // vh/dvh units and `position: fixed` ignore the on-screen keyboard).
  //  • We mirror the visual viewport — the actually-visible area, which shrinks
  //    and offsets when the keyboard opens — into CSS vars so overlays (Ask ORCA)
  //    can size to the visible region instead of the full screen.
  //  • `keyboardOpen` is driven by focus, not viewport maths, so it stays correct
  //    regardless of the browser's interactive-widget mode. The bottom nav reads
  //    it to slide away while typing.
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    const syncViewport = () => {
      if (!vv) return;
      root.style.setProperty("--vvh", `${vv.height}px`);
      root.style.setProperty("--vvtop", `${vv.offsetTop}px`);
    };
    syncViewport();
    vv?.addEventListener("resize", syncViewport);
    vv?.addEventListener("scroll", syncViewport);

    const editable = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.isContentEditable || el.tagName === "TEXTAREA") return true;
      if (el.tagName !== "INPUT") return false;
      // Inputs that don't summon a text keyboard shouldn't hide the nav.
      const type = (el as HTMLInputElement).type;
      return !["button", "submit", "reset", "checkbox", "radio", "range", "file", "color", "image"].includes(type);
    };
    const onFocusIn = (e: FocusEvent) => {
      if (editable(e.target)) setKeyboardOpen(true);
    };
    // Re-check after focus settles so moving between fields doesn't flicker the nav.
    const onFocusOut = () => requestAnimationFrame(() => setKeyboardOpen(editable(document.activeElement)));
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      vv?.removeEventListener("resize", syncViewport);
      vv?.removeEventListener("scroll", syncViewport);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
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
      keyboardOpen,
      langPickerOpen,
      openLangPicker: () => setLangPickerOpen(true),
      closeLangPicker: () => setLangPickerOpen(false),
      broadcastOpen,
      openBroadcast: () => setBroadcastOpen(true),
      closeBroadcast: () => setBroadcastOpen(false),
      broadcasts,
      bannerBroadcast,
    };
  }, [tab, lang, t, tx, txf, keyboardOpen, langPickerOpen, broadcastOpen, broadcasts]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
