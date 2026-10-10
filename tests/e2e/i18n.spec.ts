import { expect, test } from "@playwright/test";
import { buildTranslator } from "../../src/lib/i18n";

const LOCALES = ["az", "en", "ru"] as const;
const CYRILLIC = /[А-Яа-яЁё]/;
const AZERBAIJANI = /[əƏıİğĞşŞ]/;
// Words every language keeps as they are: the brand, product naming, sizes and networks.
const SHARED = /\b(hystlovers|burncode llc|love|kai|ari|aditya|t-shirt|tank top|sweatshirt|dress|ecru|xs\/s|m\/l|one size|instagram|facebook|tiktok|whatsapp|e-mail|azn|a-z|z-a|az|en|ru)\b/gi;

/** Visible text and the attributes people read, from server-rendered HTML. */
function texts(html: string): string[] {
  const body = html.replace(/<(script|style|template)[\s\S]*?<\/\1>/gi, "");
  const attributes = [...body.matchAll(/\s(?:alt|title|placeholder|aria-label)="([^"]+)"/g)].map((m) => m[1]);
  const meta = [...html.matchAll(/<meta name="description" content="([^"]+)"/g)].map((m) => m[1]);
  const title = [...html.matchAll(/<title>([^<]+)<\/title>/g)].map((m) => m[1]);
  const visible = body
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((line) => line.trim());
  return [...visible, ...attributes, ...meta, ...title]
    .map((text) => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function wrongLanguage(text: string, locale: (typeof LOCALES)[number]): boolean {
  if (/@|https?:/.test(text)) return false;
  if (locale !== "ru" && CYRILLIC.test(text)) return true;
  if (locale !== "az" && AZERBAIJANI.test(text)) return true;
  if (locale === "ru") return /[A-Za-z]{3,}/.test(text.replace(SHARED, "").replace(/\b[A-Z0-9-]{2,}\b/g, ""));
  return false;
}

test("every page speaks only its own language", async ({ request }) => {
  test.setTimeout(15 * 60_000);
  const problems: string[] = [];

  for (const locale of LOCALES) {
    const queue = ["", "/login", "/register", "/forgot-password", "/blog", "/contact", "/search?q=love"].map(
      (path) => `/${locale}${path}`,
    );
    const seen = new Set<string>();

    while (queue.length > 0) {
      const path = queue.shift()!;
      if (seen.has(path)) continue;
      seen.add(path);

      const response = await request.get(path);
      // A 404 renders in the browser, so its HTML has no text to check.
      if (response.status() === 404) continue;
      const html = await response.text();
      expect(html, path).toContain(`<html lang="${locale}"`);
      for (const text of texts(html)) {
        if (wrongLanguage(text, locale)) problems.push(`${path}: ${text}`);
      }
      for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) {
        if (href.startsWith(`/${locale}/`) && !seen.has(href)) queue.push(href);
      }
    }
    expect(seen.size, locale).toBeGreaterThan(20);
  }

  expect([...new Set(problems)]).toEqual([]);
});

test("counts use the plural form of each language", () => {
  const ru = buildTranslator(
    { cart: "Открыть корзину (:count товар)|Открыть корзину (:count товара)|Открыть корзину (:count товаров)" },
    "ru",
  );
  expect([1, 3, 5, 21].map((count) => ru("cart", { count }))).toEqual([
    "Открыть корзину (1 товар)",
    "Открыть корзину (3 товара)",
    "Открыть корзину (5 товаров)",
    "Открыть корзину (21 товар)",
  ]);
  const en = buildTranslator({ cart: ":count item|:count items" }, "en");
  expect([en("cart", { count: 1 }), en("cart", { count: 2 })]).toEqual(["1 item", "2 items"]);
});
