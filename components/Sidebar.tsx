"use client";

import type { ComponentType } from "react";
import { BriefcaseMedical, ChevronRight, Globe, Info, Megaphone, User } from "lucide-react";
import Mascot from "@/components/Mascot";
import { SolidPhone } from "@/components/glyphs";
import { useApp, type Tab } from "@/context/AppContext";
import { bannerBroadcast } from "@/lib/data";
import { languageNames } from "@/lib/i18n";

type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const items: { tab: Tab; icon: IconType; key: string }[] = [
  { tab: "info", icon: Info, key: "nav.info" },
  { tab: "support", icon: BriefcaseMedical, key: "nav.support" },
  { tab: "contacts", icon: SolidPhone, key: "nav.contacts" },
  { tab: "profile", icon: User, key: "nav.profile" },
];

export default function Sidebar() {
  const { tab, setTab, t, lang, openLangPicker, openBroadcast } = useApp();

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
          <span className="block text-[12px] text-muted">Health companion</span>
        </span>
      </div>

      {/* Broadcast shortcut */}
      <button
        type="button"
        onClick={openBroadcast}
        className="mt-6 flex items-center gap-3 rounded-2xl bg-app px-4 py-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand">
          <Megaphone size={18} className="text-white" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-bold text-ink">
            {bannerBroadcast.title}
          </span>
          <span className="block text-[11px] text-muted">View broadcasts</span>
        </span>
      </button>

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
      <p className="mt-3 px-1 text-[11px] text-faint">Frontend prototype</p>
    </aside>
  );
}
