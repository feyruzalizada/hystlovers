import type { PayloadRequest } from "payload";

/**
 * Payload's local API sets `req.locale` to the locale it is called with. A hook
 * that reads in Azerbaijani while an English save is under way would otherwise
 * make that save write its English text over the Azerbaijani one.
 */
export async function keepLocale<T>(req: PayloadRequest | undefined, run: () => Promise<T>): Promise<T> {
  if (!req) return run();
  const { locale, fallbackLocale } = req;
  try {
    return await run();
  } finally {
    req.locale = locale;
    req.fallbackLocale = fallbackLocale;
  }
}
