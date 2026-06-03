"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { languageNames, languageOrder } from "@/lib/i18n";

export default function LanguagePicker() {
  const { langPickerOpen, closeLangPicker, lang, setLang } = useApp();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langPickerOpen) return;
    menuRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLangPicker();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [langPickerOpen, closeLangPicker]);

  if (!langPickerOpen) return null;

  return (
    <div
      className="fade-enter fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choose language"
    >
      <button
        type="button"
        aria-label="Close language menu"
        onClick={closeLangPicker}
        className="absolute inset-0 bg-black/30"
      />
      <div
        ref={menuRef}
        tabIndex={-1}
        role="menu"
        className="relative w-[280px] max-w-full overflow-hidden rounded-3xl bg-white p-2 shadow-[0_18px_50px_rgba(20,30,60,0.28)] outline-none"
      >
        {languageOrder.map((code) => {
          const active = code === lang;
          return (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              onClick={() => {
                setLang(code);
                closeLangPicker();
              }}
              className={`block w-full rounded-2xl px-4 py-3.5 text-left text-[16px] ${
                active ? "font-bold text-brand" : "text-ink hover:bg-app/60"
              }`}
            >
              {languageNames[code]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
