"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Slide } from "@/lib/types";
import { useI18n } from "./I18nProvider";

const INTERVAL = 6000;

export default function Hero({ slides }: { slides: Slide[] }) {
  const { t, path } = useI18n();
  const [active, setActive] = useState(0);
  const [tick, setTick] = useState(0);

  const go = useCallback(
    (index: number) => {
      setActive((index + slides.length) % slides.length);
      setTick((value) => value + 1);
    },
    [slides.length],
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setTimeout(() => go(active + 1), INTERVAL);
    return () => clearTimeout(timer);
  }, [active, tick, slides.length, go]);

  if (slides.length === 0) return null;

  return (
    <section
      aria-label={t("home.slideshow_aria")}
      className="relative aspect-[4/5] w-full overflow-hidden bg-mist sm:aspect-[16/9] lg:aspect-[21/9]"
    >
      {slides.map((slide, index) => (
        <div
          key={`${slide.title}-${index}`}
          data-hero-slide={index === active ? "active" : "idle"}
          className="absolute inset-0"
        >
          <Image
            src={slide.imageMobile ?? slide.image}
            alt={index === active ? slide.title : ""}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover sm:hidden"
          />
          <Image
            src={slide.image}
            alt={index === active ? slide.title : ""}
            fill
            priority={index === 0}
            sizes="100vw"
            className="hidden object-cover sm:block"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 text-center sm:pb-20">
            {slide.subtitle.trim() && (
              <p className="text-xs tracking-brand uppercase sm:text-sm">{slide.subtitle}</p>
            )}
            <h2 className="heading-brand mt-2 text-4xl sm:text-6xl">{slide.title}</h2>
            {slide.cta && slide.url && (
              <Link href={path(slide.url)} className="btn-primary mt-6 sm:mt-8">
                {slide.cta}
              </Link>
            )}
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2.5">
          {slides.map((slide, index) => (
            <button
              key={`${slide.title}-dot-${index}`}
              type="button"
              aria-label={t("home.slide_aria", { number: index + 1, title: slide.title })}
              onClick={() => go(index)}
              className={`h-1.5 w-6 transition-colors ${index === active ? "bg-ink" : "bg-ink/25"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
