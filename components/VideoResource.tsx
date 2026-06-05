"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { languageNames } from "@/lib/i18n";
import { dubTrackPath, type VideoItem } from "@/lib/media";

/**
 * A featured how-to video, shown as a section card below the guidance carousel.
 * The clip is self-hosted under /public — we show the poster with a play
 * overlay first, then start the native <video> on tap.
 *
 * Localisation: the source narration is English. For any app language with a
 * pre-rendered dub (see VideoItem.dubLangs / scripts/dub.mjs), we mute the
 * video and play the dubbed MP3 in sync — switching the language picker swaps
 * the track. English (or a language without a dub) plays the original audio.
 */
export default function VideoResource({ title, src, poster, dubLangs }: VideoItem) {
  const { lang } = useApp();
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const dubbed = lang !== "en" && (dubLangs?.includes(lang) ?? false);
  const dubUrl = dubbed ? dubTrackPath(src, lang) : null;

  const start = () => {
    setPlaying(true);
    requestAnimationFrame(() => void videoRef.current?.play());
  };

  // Mirror play/pause/seek from the (muted) video onto the dub audio so the
  // narration tracks the picture. Soft drift-correction snaps back if they
  // slip more than 250ms. No-op when not dubbed.
  useEffect(() => {
    if (!dubbed) return;
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;

    const onPlay = () => {
      a.currentTime = v.currentTime;
      void a.play().catch(() => {});
    };
    const onPause = () => a.pause();
    const onSeek = () => {
      a.currentTime = v.currentTime;
    };
    const onSeeked = () => {
      a.currentTime = v.currentTime;
      if (!v.paused) void a.play().catch(() => {});
    };
    const onRate = () => {
      a.playbackRate = v.playbackRate;
    };
    const onTime = () => {
      if (v.paused) return;
      if (Math.abs(a.currentTime - v.currentTime) > 0.25) a.currentTime = v.currentTime;
    };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("seeking", onSeek);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("ratechange", onRate);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("seeking", onSeek);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("ratechange", onRate);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [dubbed, dubUrl]);

  // Switching language mid-clip: reset to the start with the right audio track.
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
      v.muted = dubbed;
    }
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setPlaying(false);
  }, [dubUrl, dubbed]);

  return (
    <section className="rounded-[24px] bg-card p-4 shadow-[0_2px_14px_rgba(30,50,90,0.06)] sm:p-5">
      <h3 className="mb-3 text-[15px] font-extrabold text-ink">{title}</h3>

      <div className="overflow-hidden rounded-[16px] border border-black/[0.07] bg-black">
        <div className="relative aspect-video w-full">
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            controls={playing}
            muted={dubbed}
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

      {/* Hidden dub track, synced to the muted video above. */}
      {dubUrl && <audio ref={audioRef} src={dubUrl} preload="auto" />}
    </section>
  );
}
