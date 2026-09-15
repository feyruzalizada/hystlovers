import "server-only";
import { cache } from "react";
import { getSiteTexts } from "./cms";
import { buildTranslator, type Translator } from "./i18n";
import type { Locale } from "./types";

export const getTranslator = cache(async (locale: Locale): Promise<Translator> =>
  buildTranslator(await getSiteTexts(locale)),
);
