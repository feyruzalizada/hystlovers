import type { CollectionAfterChangeHook, Payload, PayloadRequest } from "payload";
import { slugify } from "@/lib/slug";
import { HEX } from "./Colors";

const LOCALES = ["az", "en", "ru"] as const;

type LocalizedName = Partial<Record<(typeof LOCALES)[number], string | null>>;
type ProductFilters = {
  id: number | string;
  colorName?: LocalizedName | null;
  colorHex?: string | null;
  fabric?: LocalizedName | null;
};

const select = { colorName: true, colorHex: true, fabric: true } as const;

/** Adds a filter entry the panel does not know yet; existing entries are never touched. */
async function ensureEntry(
  payload: Payload,
  collection: "colors" | "fabrics",
  names: LocalizedName,
  extra: { hex?: string },
  req?: PayloadRequest,
) {
  const slug = slugify(names.az ?? "");
  if (!slug) return;

  const { totalDocs } = await payload.count({
    collection,
    where: { slug: { equals: slug } },
    overrideAccess: true,
    req,
  });
  if (totalDocs > 0) return;

  const created = await payload.create({
    collection,
    locale: "az",
    data: { name: names.az!, slug, showInFilter: true, ...extra } as {
      name: string;
      slug: string;
      hex: string;
    },
    overrideAccess: true,
    req,
  });
  for (const locale of LOCALES) {
    const name = names[locale];
    if (locale === "az" || !name) continue;
    await payload.update({
      collection,
      id: created.id,
      locale,
      data: { name },
      overrideAccess: true,
      req,
    });
  }
}

async function ensureFilters(payload: Payload, product: ProductFilters, req?: PayloadRequest) {
  await ensureEntry(payload, "colors", product.colorName ?? {}, { hex: hexOf(product) }, req);
  await ensureEntry(payload, "fabrics", product.fabric ?? {}, {}, req);
}

export const addProductFilters: CollectionAfterChangeHook = async ({ doc, req }) => {
  const product = (await req.payload.findByID({
    collection: "products",
    id: doc.id,
    locale: "all",
    depth: 0,
    select,
    overrideAccess: true,
    req,
  })) as unknown as ProductFilters;
  await ensureFilters(req.payload, product, req);
  return doc;
};

/** Run by the seed, after translation, so the filter starts with every catalogue colour and fabric in all languages. */
export async function syncFilters(payload: Payload) {
  const { docs } = await payload.find({
    collection: "products",
    locale: "all",
    depth: 0,
    limit: 0,
    pagination: false,
    select,
    overrideAccess: true,
  });
  const products = docs as unknown as ProductFilters[];
  // Fabrics start in the storefront's former alphabetical order.
  const byFabric = [...products].sort((a, b) => (a.fabric?.en ?? "").localeCompare(b.fabric?.en ?? ""));
  for (const product of products)
    await ensureEntry(payload, "colors", product.colorName ?? {}, {
      hex: hexOf(product),
    });
  for (const product of byFabric) await ensureEntry(payload, "fabrics", product.fabric ?? {}, {});
}

function hexOf(product: ProductFilters) {
  return product.colorHex && HEX.test(product.colorHex) ? product.colorHex : "#000000";
}
