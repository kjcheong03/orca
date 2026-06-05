"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Send, Square, Volume2, X } from "lucide-react";
import Mascot from "@/components/Mascot";
import VideoResource from "@/components/VideoResource";
import { useApp } from "@/context/AppContext";
import { patient } from "@/lib/data";
import { findVideo } from "@/lib/media";
import type { Hazard } from "@/lib/scenario";
import type { Language } from "@/lib/types";

const shortName = patient.name.split(" ").slice(0, 2).join(" "); // "Madam Tan"

interface Msg {
  role: "cara" | "user";
  text: string;
  videoId?: string | null;
}

// Localised chrome so the whole experience — not just the AI's replies —
// follows the active language.
type Ui = {
  greeting: (n: string) => string;
  placeholder: (n: string) => string;
  typing: string;
  listening: string;
  transcribing: string;
  readAloud: string;
  voiceNote: string;
  error: string;
  micError: string;
  prompts: Record<Hazard, string[]>;
};

const CHAT_UI: Record<Language, Ui> = {
  en: {
    greeting: (n) => `Hi — I'm reading today's updates for ${n}. What would you like to understand?`,
    placeholder: (n) => `Ask about ${n}…`,
    typing: "CARA is typing…",
    listening: "Listening…",
    transcribing: "Transcribing…",
    readAloud: "Read aloud",
    voiceNote: "AI assistant · voice is AI-generated",
    error: "Sorry, something went wrong. Please try again.",
    micError: "I couldn't access the microphone.",
    prompts: {
      covid: ["What should I watch for?", "Is it safe for her to go out?", "How do I use a test kit?"],
      dengue: ["What should I watch for tonight?", "What if she gets a fever?", "How do I reduce mosquito bites?"],
    },
  },
  id: {
    greeting: (n) => `Hai — saya sedang membaca info terbaru untuk ${n}. Ada yang ingin Anda tanyakan?`,
    placeholder: (n) => `Tanya tentang ${n}…`,
    typing: "CARA sedang mengetik…",
    listening: "Mendengarkan…",
    transcribing: "Menyalin…",
    readAloud: "Bacakan",
    voiceNote: "Asisten AI · suara dihasilkan AI",
    error: "Maaf, terjadi kesalahan. Coba lagi.",
    micError: "Tidak bisa mengakses mikrofon.",
    prompts: {
      covid: ["Apa yang harus saya waspadai?", "Apakah aman dia keluar rumah?", "Bagaimana cara pakai alat tes?"],
      dengue: ["Apa yang harus diwaspadai malam ini?", "Bagaimana jika dia demam?", "Bagaimana mengurangi gigitan nyamuk?"],
    },
  },
  ms: {
    greeting: (n) => `Hai — saya sedang membaca maklumat terkini untuk ${n}. Apa yang ingin anda tahu?`,
    placeholder: (n) => `Tanya tentang ${n}…`,
    typing: "CARA sedang menaip…",
    listening: "Mendengar…",
    transcribing: "Menyalin…",
    readAloud: "Baca kuat",
    voiceNote: "Pembantu AI · suara dijana AI",
    error: "Maaf, ada masalah. Cuba lagi.",
    micError: "Tidak dapat mengakses mikrofon.",
    prompts: {
      covid: ["Apa yang perlu saya perhati?", "Selamatkah dia keluar rumah?", "Bagaimana guna kit ujian?"],
      dengue: ["Apa perlu diperhati malam ini?", "Bagaimana jika dia demam?", "Bagaimana kurangkan gigitan nyamuk?"],
    },
  },
  tl: {
    greeting: (n) => `Kumusta po — binabasa ko po ang mga update ngayon para kay ${n}. Ano po ang gusto ninyong malaman?`,
    placeholder: (n) => `Magtanong tungkol kay ${n}…`,
    typing: "Nagta-type si CARA…",
    listening: "Nakikinig…",
    transcribing: "Ginagawang teksto…",
    readAloud: "Basahin nang malakas",
    voiceNote: "AI assistant · AI ang boses",
    error: "Paumanhin, may problema. Subukan ulit.",
    micError: "Hindi ma-access ang mikropono.",
    prompts: {
      covid: ["Ano po ang dapat bantayan?", "Ligtas po bang lumabas siya?", "Paano po gamitin ang test kit?"],
      dengue: ["Ano po ang bantayan ngayong gabi?", "Paano po kung magka-lagnat siya?", "Paano po bawasan ang kagat ng lamok?"],
    },
  },
  zh: {
    greeting: (n) => `您好 — 我正在查看${n}今天的最新情况。您想了解什么？`,
    placeholder: (n) => `询问关于${n}的事…`,
    typing: "CARA 正在输入…",
    listening: "正在聆听…",
    transcribing: "正在转写…",
    readAloud: "朗读",
    voiceNote: "AI 助手 · 语音由 AI 生成",
    error: "抱歉，出错了，请再试一次。",
    micError: "无法访问麦克风。",
    prompts: {
      covid: ["我该注意什么？", "她出门安全吗？", "检测试剂盒怎么用？"],
      dengue: ["今晚我该注意什么？", "如果她发烧怎么办？", "如何减少蚊虫叮咬？"],
    },
  },
  my: {
    greeting: (n) => `မင်္ဂလာပါ — ${n} အတွက် ယနေ့ အချက်အလက်များကို ဖတ်နေပါသည်။ ဘာသိချင်ပါသလဲ?`,
    placeholder: (n) => `${n} အကြောင်း မေးပါ…`,
    typing: "CARA ရိုက်နေသည်…",
    listening: "နားထောင်နေသည်…",
    transcribing: "စာသားပြောင်းနေသည်…",
    readAloud: "အသံဖတ်ပြ",
    voiceNote: "AI လက်ထောက် · အသံကို AI ဖြင့်ထုတ်သည်",
    error: "ဆောရီးပါ၊ တစ်ခုခု မှားသွားပါသည်။ ထပ်ကြိုးစားပါ။",
    micError: "မိုက်ခရိုဖုန်းကို အသုံးမပြုနိုင်ပါ။",
    prompts: {
      covid: ["ဘာတွေ သတိထားရမလဲ?", "သူ အပြင်ထွက်ရင် အန္တရာယ်ရှိမလား?", "စစ်ဆေးကိရိယာ ဘယ်လိုသုံးရမလဲ?"],
      dengue: ["ဒီည ဘာတွေ သတိထားရမလဲ?", "သူ ဖျားလာရင် ဘယ်လိုလုပ်ရမလဲ?", "ခြင်ကိုက်ခံရတာ ဘယ်လိုလျှော့ချမလဲ?"],
    },
  },
};

export default function AskCaraChat({
  open,
  onClose,
  hazard,
  date,
}: {
  open: boolean;
  onClose: () => void;
  hazard: Hazard;
  date: string;
}) {
  const { lang } = useApp();
  const ui = CHAT_UI[lang];

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [ttsLoadingIdx, setTtsLoadingIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Greet fresh each time the panel opens, in the active language.
  useEffect(() => {
    if (!open) return;
    setMessages([{ role: "cara", text: ui.greeting(shortName) }]);
    setInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Close on Escape; tidy up audio + recording whenever the panel closes.
  useEffect(() => {
    if (!open) {
      stopSpeaking();
      stopRecording();
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  if (!open) return null;

  async function send(text: string) {
    const q = text.trim();
    if (!q || sending) return;
    stopSpeaking();

    const history = [...messages, { role: "user" as const, text: q }];
    setMessages(history);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role === "cara" ? "assistant" : "user", text: m.text })),
          lang,
          hazard,
          date,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error ?? "no reply");
      setMessages((m) => [...m, { role: "cara", text: data.reply, videoId: data.videoId ?? null }]);
    } catch {
      setMessages((m) => [...m, { role: "cara", text: ui.error }]);
    } finally {
      setSending(false);
    }
  }

  // ---- Voice input (mic → transcript in the box to review) ----------------
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size === 0) return;
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "speech.webm");
          form.append("lang", lang);
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await res.json();
          if (data.text) setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
        } catch {
          /* leave the box as-is on failure */
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setMessages((m) => [...m, { role: "cara", text: ui.micError }]);
      setRecording(false);
    }
  }

  function stopRecording() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  // ---- Read-aloud (TTS on demand, never autoplayed) -----------------------
  function stopSpeaking() {
    const a = ttsAudioRef.current;
    if (a) {
      a.pause();
      a.src = "";
    }
    ttsAudioRef.current = null;
    setSpeakingIdx(null);
  }

  async function speak(idx: number, text: string) {
    if (speakingIdx === idx) {
      stopSpeaking();
      return;
    }
    stopSpeaking();
    setTtsLoadingIdx(idx);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("tts failed");
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setSpeakingIdx((cur) => (cur === idx ? null : cur));
      };
      await audio.play();
      setSpeakingIdx(idx);
    } catch {
      stopSpeaking();
    } finally {
      setTtsLoadingIdx(null);
    }
  }

  const hasText = input.trim().length > 0;

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
        <div className="flex items-center justify-between border-b border-black/5 bg-card px-5 py-3.5">
          <div>
            <p className="text-[16px] font-extrabold text-ink">Ask CARA</p>
            <p className="text-[11px] text-faint">{ui.voiceNote}</p>
          </div>
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
          {messages.map((m, i) => {
            const video = m.videoId ? findVideo(m.videoId) : null;
            return (
              <div key={i} className="space-y-2">
                <div className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "cara" && (
                    <span className="-mb-1 shrink-0">
                      <Mascot size={34} variant="cheer" animated={false} />
                    </span>
                  )}
                  <div className={`flex max-w-[80%] flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <p
                      className={`rounded-2xl px-4 py-2.5 text-[14px] leading-snug ${
                        m.role === "user"
                          ? "bg-brand text-white"
                          : "bg-card text-body shadow-[0_2px_10px_rgba(30,50,90,0.05)]"
                      }`}
                    >
                      {m.text}
                    </p>
                    {m.role === "cara" && (
                      <button
                        type="button"
                        onClick={() => speak(i, m.text)}
                        aria-label={ui.readAloud}
                        title={ui.readAloud}
                        className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-faint transition-colors hover:text-brand"
                      >
                        {ttsLoadingIdx === i ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : speakingIdx === i ? (
                          <Square size={14} className="fill-brand text-brand" />
                        ) : (
                          <Volume2 size={15} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline tutorial — dub follows the active language automatically. */}
                {video && (
                  <div className="pl-9">
                    <VideoResource {...video} />
                  </div>
                )}
              </div>
            );
          })}

          {sending && (
            <div className="flex items-center gap-2">
              <Mascot size={34} variant="cheer" animated={false} />
              <span className="flex items-center gap-1.5 rounded-2xl bg-card px-4 py-3 text-[13px] text-faint shadow-[0_2px_10px_rgba(30,50,90,0.05)]">
                <Loader2 size={14} className="animate-spin" />
                {ui.typing}
              </span>
            </div>
          )}
        </div>

        {/* Suggested prompts (hidden once the conversation gets going) */}
        {messages.length <= 1 && !sending && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
            {ui.prompts[hazard].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                className="shrink-0 rounded-full border border-brand/20 bg-card px-3.5 py-1.5 text-[12.5px] font-semibold text-brand"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-black/5 bg-card px-4 py-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={recording ? ui.listening : transcribing ? ui.transcribing : ui.placeholder(shortName)}
            disabled={recording || transcribing}
            className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand disabled:bg-app"
          />

          {hasText ? (
            <button
              type="submit"
              aria-label="Send"
              disabled={sending}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-transform active:scale-95 disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              aria-label={recording ? "Stop recording" : "Record voice"}
              disabled={transcribing}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform active:scale-95 disabled:opacity-40 ${
                recording ? "animate-pulse bg-danger text-white" : "bg-brand text-white"
              }`}
            >
              {transcribing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : recording ? (
                <Square size={16} className="fill-white" />
              ) : (
                <Mic size={18} />
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
