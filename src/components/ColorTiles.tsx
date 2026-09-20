"use client";

import Image from "next/image";
import Link from "next/link";
import type { ColorTile } from "@/lib/types";
import { useI18n } from "./I18nProvider";

/** Scrolls sideways on phones, becomes a grid from sm up — as on the live site. */
export default function ColorTiles({ tiles }: { tiles: ColorTile[] }) {
  const { path } = useI18n();

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
      {tiles.map((tile) => (
        <Link
          key={tile.slug}
          href={path(tile.url)}
          className="group w-32 shrink-0 snap-start sm:w-auto"
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-mist">
            <Image
              src={tile.image}
              alt={tile.name}
              fill
              sizes="(max-width: 640px) 8rem, 12vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <p className="mt-2.5 flex items-center gap-2 text-[11px] tracking-wide2 uppercase sm:text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full border border-ink/15"
              style={{ background: tile.hex }}
            />
            {tile.name}
          </p>
        </Link>
      ))}
    </div>
  );
}
