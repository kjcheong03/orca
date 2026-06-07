"use client";

import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import BroadcastSheet from "@/components/BroadcastSheet";
import LanguagePicker from "@/components/LanguagePicker";
import OfflineBanner from "@/components/OfflineBanner";
import Sidebar from "@/components/Sidebar";
import ContactsScreen from "@/components/screens/ContactsScreen";
import InfoScreen from "@/components/screens/InfoScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import SupportScreen from "@/components/screens/SupportScreen";
import { AppProvider, useApp, type Tab } from "@/context/AppContext";
import { flushQueue } from "@/lib/requestQueue";

const screens: { tab: Tab; Component: () => React.ReactNode }[] = [
  { tab: "info", Component: InfoScreen },
  { tab: "support", Component: SupportScreen },
  { tab: "contacts", Component: ContactsScreen },
  { tab: "profile", Component: ProfileScreen },
];

function Shell() {
  const { tab } = useApp();

  // Flush any requests submitted while offline — on first load and whenever the
  // connection returns. The shell is always mounted, so queued requests get
  // sent even if the user never opens the Community tab. (Replay is idempotent.)
  useEffect(() => {
    void flushQueue();
    const onOnline = () => void flushQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-app">
      <div className="lg:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          {/* All screens stay mounted so in-progress flows (e.g. an emergency
              call) survive tab switches; only the active one is shown. */}
          <div className="mx-auto w-full max-w-5xl pb-20 lg:pb-14">
            {screens.map(({ tab: t, Component }) => (
              <div key={t} hidden={tab !== t}>
                <Component />
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Overlays cover the whole viewport */}
      <BroadcastSheet />
      <LanguagePicker />
      <OfflineBanner />
    </div>
  );
}

export default function PhoneApp() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
