"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import Mascot from "@/components/Mascot";
import { patient } from "@/lib/data";
import type { Hazard } from "@/lib/scenario";

const shortName = patient.name.split(" ").slice(0, 2).join(" "); // "Madam Tan"

interface Msg {
  role: "cara" | "user";
  text: string;
}

const PROMPTS: Record<Hazard, string[]> = {
  covid: [
    "What should I watch for?",
    "Should I update her booster?",
    "Is it safe for her to go out?",
    "Explain this simply",
  ],
  dengue: [
    "What should I watch for tonight?",
    "What if she gets a fever?",
    "How do I reduce mosquito bites?",
    "How worried should I be?",
  ],
};

/** A warm, canned reply — this is a frontend prototype, not a real model. */
function reply(q: string, hazard: Hazard): string {
  const s = q.toLowerCase();
  const who = `${shortName} (${patient.age}, ${patient.conditions.join(" & ")})`;

  if (s.includes("simpl") || s.includes("mandarin") || s.includes("chinese")) {
    return `In short: there's an active ${hazard === "dengue" ? "dengue" : "respiratory illness"} signal. The steps in ${shortName}'s tailored card cover the main things to do — I can walk through any of them.`;
  }
  if (s.includes("fever")) {
    return `If ${shortName} gets a fever, use paracetamol (not ibuprofen or aspirin), keep fluids up, and note when it started. At her age, see a doctor early rather than waiting it out.`;
  }
  if (s.includes("worried") || s.includes("worry") || s.includes("bad")) {
    return `It's a "stay alert, don't panic" day. The signal is active, but following the tailored steps covers the main risks for ${who}. I'll flag anything that changes.`;
  }
  if (s.includes("tonight") || s.includes("watch")) {
    return hazard === "dengue"
      ? `Tonight, watch ${shortName} for fever, unusual tiredness, or warning signs like bleeding gums or bad tummy pain. Keep her protected from mosquito bites.`
      : `Watch ${shortName} for fever, cough, or breathlessness. Keep her comfortable and hydrated, and test early if symptoms show.`;
  }
  if (s.includes("out") || s.includes("safe")) {
    return `Keep outings short and to quieter times. If she goes out, follow the precautions in her tailored card. I'll let you know if the situation worsens.`;
  }
  if (s.includes("booster") || s.includes("vaccin")) {
    return `Keeping ${shortName}'s COVID-19 and flu boosters current is one of the most effective protections at her age. If it's been a while, it's worth booking a top-up.`;
  }
  if (s.includes("mosquito") || s.includes("bite") || s.includes("repellent")) {
    return `Apply repellent on ${shortName}, keep her in long sleeves at dawn and dusk, clear any standing water at home, and use a bed net. There's an active cluster nearby, so this matters now.`;
  }
  return `Good question. Based on today's ${hazard === "dengue" ? "dengue" : "respiratory"} update and ${who}, I'd focus on the steps in her tailored card. Ask me anything more specific and I'll explain it gently.`;
}

export default function AskCaraChat({
  open,
  onClose,
  hazard,
}: {
  open: boolean;
  onClose: () => void;
  hazard: Hazard;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Greet fresh each time the panel opens.
  useEffect(() => {
    if (!open) return;
    setMessages([
      {
        role: "cara",
        text: `Hi — I'm reading today's updates for ${shortName}. What would you like to understand?`,
      },
    ]);
    setInput("");
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }, { role: "cara", text: reply(q, hazard) }]);
    setInput("");
  };

  return (
    <div
      className="fade-enter fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Ask CARA"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div className="pop-enter relative flex h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-app sm:h-[600px] sm:max-h-[86dvh] sm:rounded-[28px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 bg-card px-5 py-4">
          <p className="text-[16px] font-extrabold text-ink">Ask CARA</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-app shadow-sm"
          >
            <X size={20} className="text-ink" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "cara" && (
                <span className="-mb-1 shrink-0">
                  <Mascot size={34} variant="cheer" animated={false} />
                </span>
              )}
              <p
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[14px] leading-snug ${
                  m.role === "user"
                    ? "bg-brand text-white"
                    : "bg-card text-body shadow-[0_2px_10px_rgba(30,50,90,0.05)]"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
        </div>

        {/* Suggested prompts */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {PROMPTS[hazard].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => ask(p)}
              className="shrink-0 rounded-full border border-brand/20 bg-card px-3.5 py-1.5 text-[12.5px] font-semibold text-brand"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 border-t border-black/5 bg-card px-4 py-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${shortName}…`}
            className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!input.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-transform active:scale-95 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
