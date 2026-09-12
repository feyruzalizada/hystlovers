import type { Locale } from "./types";
import az from "@/i18n/messages/az.json";
import en from "@/i18n/messages/en.json";
import ru from "@/i18n/messages/ru.json";

export const locales: Locale[] = ["az", "en", "ru"];
export const defaultLocale: Locale = "az";

export const localeNames: Record<Locale, { name: string; short: string }> = {
  az: { name: "Azərbaycan", short: "AZ" },
  en: { name: "English", short: "EN" },
  ru: { name: "Русский", short: "RU" },
};

const messages: Record<Locale, Record<string, string>> = { az, en, ru };

export function isLocale(value: string): value is Locale {
  return (locales as string[]).includes(value);
}

export type Translator = (key: string, params?: Record<string, string | number>) => string;

export function getMessages(locale: Locale): Record<string, string> {
  return messages[locale] ?? messages[defaultLocale];
}

export function createTranslator(locale: Locale): Translator {
  const dict = getMessages(locale);
  return (key, params) => {
    let value = dict[key] ?? messages[defaultLocale][key] ?? key;
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
