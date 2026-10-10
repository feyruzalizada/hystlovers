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

/** Plural form order in a "one|other" text, per language. */
const PLURAL_FORMS: Record<Locale, Intl.LDMLPluralRule[]> = {
  az: ["one", "other"],
  en: ["one", "other"],
  ru: ["one", "few", "many"],
};

function pluralForm(value: string, locale: Locale, count: number): string {
  const forms = value.split("|");
  const rule = new Intl.PluralRules(locale).select(count);
  const index = PLURAL_FORMS[locale].indexOf(rule);
  return forms[index === -1 ? forms.length - 1 : Math.min(index, forms.length - 1)];
}

/**
 * Site texts are rows in the CMS, so a translator is built from a message map
 * the caller has already loaded — `getTranslator` on the server, the messages
 * handed to `I18nProvider` on the client. A text with `|` holds plural forms
 * picked by the `count` parameter.
 */
export function buildTranslator(messages: Record<string, string>, locale: Locale): Translator {
  return (key, params) => {
    let value = messages[key] ?? key;
    if (value.includes("|") && typeof params?.count === "number") {
      value = pluralForm(value, locale, params.count);
    }
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
