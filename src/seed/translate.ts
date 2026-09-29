import type { CollectionSlug, Payload } from "payload";
import { htmlToLexical } from "./html-to-lexical";
import {
  categoryNames,
  colorNames,
  fabrics,
  pages,
  productDescription,
  productPhrases,
  slideTexts,
  workingHours,
  type Text,
} from "./translations";

const LOCALES = ["az", "en", "ru"] as const;
type Locale = (typeof LOCALES)[number];
type Doc = Record<string, unknown> & { id: number | string };

/**
 * One translatable field: `read` turns the stored value into a comparable
 * string, `lookup` finds its translations from the values in every locale,
 * and `write` turns a translation back into what Payload stores.
 */
type Field = {
  read: (value: unknown) => string | null;
  lookup: (values: (string | null)[], doc: Doc) => Text | null;
  write?: (value: string) => unknown;
};

const known = (text: Text) => [text.en, ...(text.was ?? [])];
const among = (texts: Text[]) => (values: (string | null)[]) =>
  texts.find((text) => values.some((value) => value !== null && known(text).includes(value))) ?? null;
const plain = (value: unknown) => (typeof value === "string" && value !== "" ? value : null);

const list: Pick<Field, "read" | "write"> = {
  read: (value) => (Array.isArray(value) && value.length ? JSON.stringify(value.map((row) => row.value)) : null),
  write: (value) => (JSON.parse(value) as string[]).map((entry) => ({ value: entry })),
};

function listOf(texts: Text[]): Field {
  return {
    ...list,
    lookup: (values) => {
      for (const value of values) {
        if (!value) continue;
        const rows = (JSON.parse(value) as string[]).map((entry) => texts.find((text) => known(text).includes(entry)));
        if (rows.some((row) => !row)) continue;
        const pick = (locale: Locale) => JSON.stringify(rows.map((row) => row![locale]));
        return { az: pick("az"), en: pick("en"), ru: pick("ru"), was: [value] };
      }
      return null;
    },
  };
}

type LexicalNode = { type: string; text?: string; children?: LexicalNode[] };
const paragraphs = (value: unknown): string | null => {
  const root = (value as { root?: LexicalNode } | null)?.root;
  if (!root?.children?.length) return null;
  const text = (node: LexicalNode): string => node.text ?? (node.children ?? []).map(text).join("");
  return JSON.stringify(root.children.map(text));
};
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const text = (texts: Text[]): Field => ({ read: plain, lookup: among(texts) });

const COLLECTIONS: [CollectionSlug, Record<string, Field>][] = [
  ["categories", { name: text(categoryNames) }],
  [
    "products",
    {
      colorName: text(colorNames),
      fabric: text(fabrics),
      composition: text(productPhrases),
      description: {
        read: plain,
        lookup: (values) => values.map((value) => (value ? productDescription(value) : null)).find(Boolean) ?? null,
      },
      features: listOf(productPhrases),
    },
  ],
  ["home-sections", { title: text(categoryNames) }],
  ["slides", { title: text([{ en: "-", az: "-", ru: "-" }]), ctaLabel: text(slideTexts) }],
  [
    "pages",
    {
      title: { read: plain, lookup: (_, doc) => pages[String(doc.slug)]?.title ?? null },
      body: {
        read: paragraphs,
        lookup: (_, doc) => {
          const body = pages[String(doc.slug)]?.body;
          if (!body) return null;
          return {
            az: JSON.stringify(body.az),
            en: JSON.stringify(body.en),
            ru: JSON.stringify(body.ru),
            was: (body.was ?? []).map((variant) => JSON.stringify(variant)),
          };
        },
        write: (value) => htmlToLexical((JSON.parse(value) as string[]).map((p) => `<p>${escape(p)}</p>`).join("")),
      },
    },
  ],
];

async function read(payload: Payload, collection: CollectionSlug, locale: Locale): Promise<Doc[]> {
  const result = await payload.find({ collection, locale, fallbackLocale: false, depth: 0, limit: 0, pagination: false });
  return result.docs as unknown as Doc[];
}

/**
 * Fills in the languages the imported content lacked. A value is replaced only
 * while it is empty or still the imported English, so edits made in the panel
 * are never overwritten and re-running changes nothing.
 */
export async function translateContent(payload: Payload) {
  let updates = 0;

  for (const [collection, fields] of COLLECTIONS) {
    const docs = Object.fromEntries(
      await Promise.all(LOCALES.map(async (locale) => [locale, await read(payload, collection, locale)] as const)),
    ) as Record<Locale, Doc[]>;

    for (const base of docs.az) {
      const inLocale = (locale: Locale) => docs[locale].find((doc) => doc.id === base.id) ?? ({} as Doc);

      for (const locale of LOCALES) {
        const current = inLocale(locale);
        const data: Record<string, unknown> = {};

        for (const [name, field] of Object.entries(fields)) {
          const values = LOCALES.map((l) => field.read(inLocale(l)[name]));
          const translation = field.lookup(values, base);
          if (!translation) continue;
          const now = field.read(current[name]);
          if (now !== null && !known(translation).includes(now)) continue;
          if (now === translation[locale]) continue;
          data[name] = field.write ? field.write(translation[locale]) : translation[locale];
        }

        if (Object.keys(data).length > 0) {
          await payload.update({ collection, id: base.id, locale, data });
          updates++;
        }
      }
    }
  }

  for (const locale of LOCALES) {
    const settings = await payload.findGlobal({ slug: "settings", locale, fallbackLocale: false });
    const now = plain(settings.workingHours);
    if ((now === null || known(workingHours).includes(now)) && now !== workingHours[locale]) {
      await payload.updateGlobal({ slug: "settings", locale, data: { workingHours: workingHours[locale] } });
      updates++;
    }
  }

  payload.logger.info(`translations: ${updates} records updated`);
}
