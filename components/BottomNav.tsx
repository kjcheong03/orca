"use client";

import type { ComponentType } from "react";
import { Info, User, UsersRound } from "lucide-react";
import { SolidPhone } from "@/components/glyphs";
import { useApp, type Tab } from "@/context/AppContext";

type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

interface NavItem {
  tab: Tab;
  icon: IconType;
  key: string;
}

const items: NavItem[] = [
  { tab: "info", icon: Info, key: "nav.info" },
  { tab: "support", icon: UsersRound, key: "nav.support" },
  { tab: "contacts", icon: SolidPhone, key: "nav.contacts" },
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
        className={`mx-1.5 my-1.5 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-colors ${
          active ? fill : "text-[#7d8591]"
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
  const { tab, setTab, t, keyboardOpen } = useApp();

  return (
    <nav
      // On mobile the keyboard would otherwise strand this fixed bar mid-screen
      // (iOS) or cover it — slide it out of the way while a field is focused.
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white transition-transform duration-200 lg:hidden ${
        keyboardOpen ? "pointer-events-none translate-y-full" : ""
      }`}
      aria-hidden={keyboardOpen || undefined}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* fixed-height bar; the four tabs fill the width (each flex-1). The
          language switcher now lives in the Profile toolbar, not here. */}
      <ul className="flex h-14 w-full items-stretch">
        <TabCell item={items[0]} active={tab === "info"} label={t("nav.info")} onSelect={() => setTab("info")} />
        <TabCell item={items[1]} active={tab === "support"} label={t("nav.support")} onSelect={() => setTab("support")} />
        <TabCell item={items[2]} active={tab === "contacts"} label={t("nav.contacts")} onSelect={() => setTab("contacts")} />
        <TabCell item={items[3]} active={tab === "profile"} label={t("nav.profile")} onSelect={() => setTab("profile")} />
      </ul>
    </nav>
  );
}
