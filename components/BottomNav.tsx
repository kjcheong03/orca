"use client";

import { BriefcaseMedical, Info, Phone, User, type LucideIcon } from "lucide-react";
import { useApp, type Tab } from "@/context/AppContext";
import { languageCodes } from "@/lib/i18n";

interface NavItem {
  tab: Tab;
  icon: LucideIcon;
  key: string;
}

const items: NavItem[] = [
  { tab: "info", icon: Info, key: "nav.info" },
  { tab: "support", icon: BriefcaseMedical, key: "nav.support" },
  { tab: "contacts", icon: Phone, key: "nav.contacts" },
  { tab: "profile", icon: User, key: "nav.profile" },
];

function TabCell({
  item,
  active,
  label,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  const fill = item.tab === "contacts" ? "bg-danger text-white" : "bg-brand text-white";
  const Icon = item.icon;
  return (
    <li className="flex flex-1">
      <button
        type="button"
        onClick={onSelect}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`m-1.5 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-colors ${
          active ? fill : "text-faint"
        }`}
      >
        <span className="grid h-6 w-6 place-items-center">
          <Icon size={22} strokeWidth={active ? 2.4 : 2} />
        </span>
        <span className="leading-none">{label}</span>
      </button>
    </li>
  );
}

export default function BottomNav() {
  const { tab, setTab, t, lang, openLangPicker } = useApp();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* fixed-height bar; each cell flex-1 (equal width); language sits
          dead-centre, inline (not raised) — matches the reference NavShell */}
      <ul className="flex h-14 w-full items-stretch justify-around">
        <TabCell item={items[0]} active={tab === "info"} label={t("nav.info")} onSelect={() => setTab("info")} />
        <TabCell item={items[1]} active={tab === "support"} label={t("nav.support")} onSelect={() => setTab("support")} />

        <li className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={openLangPicker}
            aria-label="Change language"
            className="grid h-11 w-11 place-items-center rounded-full bg-brand text-[13px] font-bold text-white shadow-md shadow-brand/30 transition-transform active:scale-95"
          >
            {languageCodes[lang]}
          </button>
        </li>

        <TabCell item={items[2]} active={tab === "contacts"} label={t("nav.contacts")} onSelect={() => setTab("contacts")} />
        <TabCell item={items[3]} active={tab === "profile"} label={t("nav.profile")} onSelect={() => setTab("profile")} />
      </ul>
    </nav>
  );
}
