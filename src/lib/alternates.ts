import type { Metadata } from "next";
import { locales } from "./i18n";

/**
 * hreflang alternates so the three languages are indexed as one page in three
 * versions rather than as competing duplicates — as the source layout did.
 */
export function localeAlternates(path: string): Metadata["alternates"] {
  const suffix = path === "/" ? "" : path;

  return {
    languages: Object.fromEntries(locales.map((code) => [code, `/${code}${suffix}`])),
  };
}
