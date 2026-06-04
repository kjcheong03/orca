"use client";

import { useState } from "react";
import CommunityHome from "@/components/community/CommunityHome";
import CommunityRequest from "@/components/community/CommunityRequest";

export default function SupportScreen() {
  const [view, setView] = useState<"home" | "flow">("home");

  if (view === "flow") return <CommunityRequest onExit={() => setView("home")} />;
  return <CommunityHome onStart={() => setView("flow")} />;
}
