"use client";

import type { ComponentType } from "react";
import { ChevronRight, Globe, Info, User, UsersRound } from "lucide-react";
import Mascot from "@/components/Mascot";
import { SolidPhone } from "@/components/glyphs";
import { useApp, type Tab } from "@/context/AppContext";
import { languageNames } from "@/lib/i18n";

type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const items: { tab: Tab; icon: IconType; key: string }[] = [
  { tab: "info", icon: Info, key: "nav.info" },
  { tab: "support", icon: UsersRound, key: "nav.support" },
  { tab: "contacts", icon: SolidPhone, key: "nav.contacts" },
  { tab: "profile", icon: User, key: "nav.profile" },
];

export default function Sidebar() {
  const { tab, setTab, t, lang, openLangPicker } = useApp();

  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-72 shrink-0 flex-col border-r border-black/5 bg-white px-5 py-7 lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-1">
        <span className="-my-2">
          <Mascot size={52} />
        </span>
        <span>
          <span className="block text-[17px] font-extrabold tracking-tight text-ink">
            CARA
          </span>
          <span className="block text-[12px] leading-snug text-muted">Crisis-Aware Response Assistant</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="mt-6 flex flex-col gap-2">
        {items.map((item) => {
          const active = tab === item.tab;
          const activeBg = item.tab === "contacts" ? "bg-danger" : "bg-brand";
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => setTab(item.tab)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-semibold transition-colors ${
                active ? `${activeBg} text-white` : "text-body hover:bg-app"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {t(item.key)}
            </button>
          );
        })}
      </nav>

      {/* Language */}
      <button
        type="button"
        onClick={openLangPicker}
        className="mt-auto flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3 text-left text-[13px] font-medium text-ink hover:bg-app"
      >
        <Globe size={20} className="text-brand" />
        <span className="flex-1 truncate">{languageNames[lang]}</span>
        <ChevronRight size={18} className="text-faint" />
      </button>
    </aside>
  );
}
