import type { Locale } from "./types";

export const locales: Locale[] = ["az", "en", "ru"];
export const defaultLocale: Locale = "az";

export const localeNames: Record<Locale, { name: string; short: string }> = {
  az: { name: "Azərbaycan", short: "AZ" },
  en: { name: "English", short: "EN" },
  ru: { name: "Русский", short: "RU" },
};

export function isLocale(value: string): value is Locale {
  return (locales as string[]).includes(value);
}

export type Translator = (key: string, params?: Record<string, string | number>) => string;

/**
 * Site texts are rows in the CMS, so a translator is built from a message map
 * the caller has already loaded — `getTranslator` on the server, the messages
 * handed to `I18nProvider` on the client.
 */
export function buildTranslator(messages: Record<string, string>): Translator {
  return (key, params) => {
    let value = messages[key] ?? key;
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replaceAll(`:${name}`, String(replacement));
      }
    }
    return value;
  };
}

export function localePath(locale: Locale, path: string): string {
  const suffix = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${suffix}`;
}
