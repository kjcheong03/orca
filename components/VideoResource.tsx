"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { languageNames } from "@/lib/i18n";
import { dubVideoSrc, type VideoItem } from "@/lib/media";

/**
 * A featured how-to video, shown as a section card below the guidance carousel.
 * The clip is self-hosted on Supabase — poster + play overlay first, then the
 * native <video> on tap.
 *
 * Localisation: for any app language with a dub (VideoItem.dubLangs), we load a
 * separate MP4 whose ONLY audio track is that language (baked in by
 * scripts/mux-dubs.mjs). Because there's a single audio source, the native
 * player's mute / unmute / volume control the selected language directly — no
 * overlaid audio, no sync. English (or a language without a dub) plays the
 * original.
 */
export default function VideoResource({ title, src, poster, dubLangs }: VideoItem) {
  const { lang, tx } = useApp();
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const dubbed = lang !== "en" && (dubLangs?.includes(lang) ?? false);
  const videoSrc = dubbed ? dubVideoSrc(src, lang) : src;

  const start = () => {
    setPlaying(true);
    requestAnimationFrame(() => void videoRef.current?.play());
  };

  // Switching language swaps the source — reset to the poster so the new
  // (dubbed) track starts cleanly from the beginning.
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    setPlaying(false);
  }, [videoSrc]);

  return (
    <section className="rounded-[24px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)] sm:p-5">
      <h3 className="mb-3 text-[15px] font-extrabold text-ink">{tx(title)}</h3>

      <div className="overflow-hidden rounded-[16px] border border-black/[0.07] bg-black">
        <div className="relative aspect-video w-full">
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            poster={poster}
            controls={playing}
            playsInline
            preload="none"
            className="absolute inset-0 h-full w-full"
          />

          {/* Dub indicator */}
          {dubbed && (
            <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {languageNames[lang]}
            </span>
          )}

          {!playing && (
            <button
              type="button"
              onClick={start}
              aria-label={`Play: ${title}`}
              className="group absolute inset-0 h-full w-full"
            >
              <span className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />
              <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-lg transition-transform group-active:scale-95">
                <Play size={24} className="ml-0.5 fill-brand text-brand" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
