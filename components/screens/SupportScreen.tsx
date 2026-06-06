"use client";

import { useState } from "react";
import CommunityHome from "@/components/community/CommunityHome";
import CommunityRequest from "@/components/community/CommunityRequest";
import { type SupportTypeId } from "@/lib/community";

export default function SupportScreen() {
  const [view, setView] = useState<"home" | "flow">("home");
  // A support type pre-selected by tapping its icon on the home screen (else blank).
  const [preset, setPreset] = useState<SupportTypeId | undefined>(undefined);

  if (view === "flow") return <CommunityRequest initialType={preset} onExit={() => setView("home")} />;
  return (
    <CommunityHome
      onStart={(type) => {
        setPreset(type);
        setView("flow");
      }}
    />
  );
}
