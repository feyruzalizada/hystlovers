import type { Payload, PayloadRequest } from "payload";
import { buildTranslator, defaultLocale, isLocale, localePath, type Translator } from "./i18n";
import type { Locale } from "./types";

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Read straight from the collection: this runs inside Payload's own hook, outside React. */
async function translator(payload: Payload, locale: Locale): Promise<Translator> {
  const result = await payload.find({ collection: "site-texts", limit: 0, pagination: false, depth: 0 });
  const messages = Object.fromEntries(result.docs.map((doc) => [doc.key, doc[locale] || doc.az]));
  return buildTranslator(messages, locale);
}

/** `requestPasswordReset` passes the page language in the request context. */
function fromRequest(req: PayloadRequest | undefined): Promise<[Translator, Locale]> {
  if (!req) throw new Error("password reset email needs the request");
  const value = req.context.locale;
  const locale = typeof value === "string" && isLocale(value) ? value : defaultLocale;
  return translator(req.payload, locale).then((t) => [t, locale]);
}

export async function resetEmailSubject(req: PayloadRequest | undefined): Promise<string> {
  const [t] = await fromRequest(req);
  return t("mail.reset.subject");
}

/** The storefront's reset page, in the language the shopper asked from. */
export async function resetEmailHtml(req: PayloadRequest | undefined, token: string): Promise<string> {
  const [t, locale] = await fromRequest(req);
  const url = `${process.env.SERVER_URL ?? ""}${localePath(locale, `/reset-password/${token}`)}`;

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; color: #1c1c1c; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 18px; letter-spacing: .14em; text-transform: uppercase;">Hystlovers</h1>
  <p>${escape(t("mail.reset.intro"))}</p>
  <p style="margin: 24px 0;">
    <a href="${escape(url)}" style="background: #1c1c1c; color: #fff; padding: 12px 24px; text-decoration: none; font-size: 13px; letter-spacing: .1em; text-transform: uppercase;">${escape(t("mail.reset.cta"))}</a>
  </p>
  <p style="color: #777; font-size: 12px;">${escape(t("mail.reset.expires"))}</p>
  <p style="color: #777; font-size: 12px;">${escape(t("mail.reset.ignore"))}</p>
</body>
</html>`;
}
