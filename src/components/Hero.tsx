"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Slide } from "@/lib/types";
import { useI18n } from "./I18nProvider";

export default function Hero({ slides }: { slides: Slide[] }) {
  const { t, path } = useI18n();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index];

  return (
    <section className="relative h-[70vh] min-h-[420px] w-full overflow-hidden bg-mist">
      <Image
        src={slide.image}
        alt={t("home.slide_aria", { number: index + 1, title: slide.title })}
        fill
        priority
        sizes="(min-width: 768px) 100vw, 1px"
        className="hidden object-cover md:block"
      />
      <Image
        src={slide.imageMobile ?? slide.image}
        alt=""
        fill
        priority
        sizes="(max-width: 767px) 100vw, 1px"
        className="object-cover md:hidden"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-end gap-5 pb-16 text-center">
        {slide.title.trim() && (
          <h1 className="heading-brand text-2xl text-paper drop-shadow md:text-4xl">{slide.title}</h1>
        )}
        {slide.subtitle.trim() && <p className="text-sm text-paper drop-shadow">{slide.subtitle}</p>}
        <Link href={path(slide.url)} className="btn-primary bg-paper text-ink hover:bg-mist">
          {slide.cta}
        </Link>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t("home.slide_aria", { number: i + 1, title: slides[i].title })}
              onClick={() => setIndex(i)}
              className={`h-1 w-8 ${i === index ? "bg-paper" : "bg-paper/40"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
