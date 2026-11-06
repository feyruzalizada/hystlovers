"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "./I18nProvider";

const KEY = "hl-sound";
const LABEL = {
  az: { on: "Səsi bağla", off: "Səsi aç" },
  en: { on: "Mute sound", off: "Play sound" },
  ru: { on: "Выключить звук", off: "Включить звук" },
};

/**
 * Site-wide background sound. Browsers refuse sound before the visitor has
 * interacted with the page, so it starts on the first click, tap or key press.
 */
export default function BackgroundAudio({ src }: { src: string }) {
  const { locale } = useI18n();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    element.volume = 0.5;
    let muted = false;
    try {
      muted = localStorage.getItem(KEY) === "off";
    } catch {
      // Storage may be blocked; play as usual.
    }
    if (muted) return;

    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const start = () => {
      element.play().then(
        () => events.forEach((name) => window.removeEventListener(name, start)),
        () => {},
      );
    };
    element.play().catch(() => events.forEach((name) => window.addEventListener(name, start)));
    return () => events.forEach((name) => window.removeEventListener(name, start));
  }, [src]);

  const toggle = () => {
    const element = audio.current;
    if (!element) return;
    const next = element.paused;
    if (next) void element.play().catch(() => {});
    else element.pause();
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {
      // See above.
    }
  };

  const label = (LABEL[locale as keyof typeof LABEL] ?? LABEL.en)[playing ? "on" : "off"];

  return (
    <>
      <audio
        ref={audio}
        src={src}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="fixed bottom-5 left-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-ink/80 text-paper shadow-md transition-colors hover:bg-ink"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          {playing ? <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /> : <path d="m22 9-6 6M16 9l6 6" />}
        </svg>
      </button>
    </>
  );
}
