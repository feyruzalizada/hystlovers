import type { CollectionAfterChangeHook, Payload, PayloadRequest } from "payload";
import { slugify } from "@/lib/slug";
import { HEX } from "./Colors";

const LOCALES = ["az", "en", "ru"] as const;

type LocalizedName = Partial<Record<(typeof LOCALES)[number], string | null>>;
type ProductColor = { id: number | string; colorName?: LocalizedName | null; colorHex?: string | null };

/** Adds a swatch for a product colour the palette does not know yet; existing swatches are never touched. */
async function ensureColor(payload: Payload, product: ProductColor, req?: PayloadRequest) {
  const names = product.colorName ?? {};
  const slug = slugify(names.az ?? "");
  if (!slug) return;

  const { totalDocs } = await payload.count({ collection: "colors", where: { slug: { equals: slug } }, overrideAccess: true, req });
  if (totalDocs > 0) return;

  const hex = product.colorHex && HEX.test(product.colorHex) ? product.colorHex : "#000000";
  const created = await payload.create({
    collection: "colors",
    locale: "az",
    data: { name: names.az!, hex, slug, showInFilter: true },
    overrideAccess: true,
    req,
  });
  for (const locale of LOCALES) {
    const name = names[locale];
    if (locale === "az" || !name) continue;
    await payload.update({ collection: "colors", id: created.id, locale, data: { name }, overrideAccess: true, req });
  }
}

export const addProductColor: CollectionAfterChangeHook = async ({ doc, req }) => {
  const product = (await req.payload.findByID({
    collection: "products",
    id: doc.id,
    locale: "all",
    depth: 0,
    select: { colorName: true, colorHex: true },
    overrideAccess: true,
    req,
  })) as unknown as ProductColor;
  await ensureColor(req.payload, product, req);
  return doc;
};

/** Run by the seed, after translation, so the palette starts with every catalogue colour in all languages. */
export async function syncColors(payload: Payload) {
  const { docs } = await payload.find({
    collection: "products",
    locale: "all",
    depth: 0,
    limit: 0,
    pagination: false,
    select: { colorName: true, colorHex: true },
    overrideAccess: true,
  });
  for (const product of docs as unknown as ProductColor[]) await ensureColor(payload, product);
}
