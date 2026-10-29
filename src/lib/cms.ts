import "server-only";
import { cache } from "react";
import { getPayload, type Payload } from "payload";
import config from "@payload-config";
import { slugify } from "./slug";
import { productName } from "./product-name";
import { defaultLocale } from "./i18n";
import type {
  Brand,
  Category as CmsCategory,
  HomeSection,
  Media,
  Page as CmsPage,
  Post as CmsPost,
  Product as CmsProduct,
  Setting,
  Slide as CmsSlide,
  SiteText,
} from "@/payload-types";
import type {
  BlogPost,
  Category,
  ContactDetails,
  Facets,
  FilterOption,
  FooterGroup,
  Locale,
  NavItem,
  Product,
  ProductSibling,
  ShopSettings,
  Slide,
  StaticPage,
} from "./types";

export const payloadClient = cache(async (): Promise<Payload> => getPayload({ config }));

const ALL = { limit: 0, pagination: false } as const;

type Related<T> = number | T | null | undefined;

function resolve<T>(value: Related<T>): T | null {
  return value && typeof value === "object" ? value : null;
}

const BLOB_HOST = /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//;

/**
 * Files in Vercel Blob keep their own URL. Local ones come back absolute once
 * SERVER_URL is set; next/image only accepts allow-listed remote hosts, and
 * this app serves the files anyway, so they are reduced back to a path.
 */
function mediaUrl(value: Related<Media>): string | null {
  const url = resolve(value)?.url;
  if (!url) return null;
  if (BLOB_HOST.test(url)) return url;
  let path = url;
  if (url.startsWith("http")) {
    const parsed = URL.parse(url);
    path = parsed ? `${parsed.pathname}${parsed.search}` : url;
  }
  // The files sit in public/media, so serve them statically: prerendered
  // pages then need neither Payload's route nor a database at runtime.
  return path.replace(/^\/api\/media\/file\//, "/media/");
}

function remainingFor(doc: CmsProduct, size: string): number | null {
  const quantity = (doc.sizes ?? []).find((entry) => entry.size === size)?.quantity;
  return quantity === null || quantity === undefined ? null : Math.max(0, quantity);
}

function isOrderable(doc: CmsProduct, size: string, qty = 1): boolean {
  const sizes = (doc.sizes ?? []).map((entry) => entry.size);
  if (!sizes.includes(size)) return false;
  if (doc.isPreorder) return true;
  if (!doc.inStock) return false;
  const remaining = remainingFor(doc, size);
  return remaining === null || remaining >= qty;
}

function toProduct(doc: CmsProduct, slugs: { color: string; fabric: string }, locale: Locale): Product {
  const sizes = (doc.sizes ?? []).map((entry) => entry.size);
  const category = resolve(doc.category);
  const images = (doc.images ?? [])
    .map((row) => mediaUrl(row.image))
    .filter((url): url is string => Boolean(url));

  // A single image is duplicated so the card's hover swap always has a partner.
  if (images.length === 1) images.push(images[0]);

  return {
    slug: doc.slug,
    name: productName(doc, locale),
    series: doc.series,
    item: doc.item,
    type: (doc.setParts ?? []).length > 0 ? "set" : "single",
    category: category?.name ?? "",
    category_slug: category?.slug ?? "",
    fabric: doc.fabric ?? "",
    fabric_slug: slugs.fabric,
    price: Number(doc.price),
    compare_at: doc.compareAtPrice != null ? Number(doc.compareAtPrice) : null,
    color: { slug: slugs.color, name: doc.colorName ?? "", hex: doc.colorHex ?? "#000000" },
    sizes,
    size_stock: Object.fromEntries(
      sizes.map((size) => [
        size,
        { available: isOrderable(doc, size), remaining: doc.isPreorder ? null : remainingFor(doc, size) },
      ]),
    ),
    in_stock: sizes.some((size) => isOrderable(doc, size)),
    is_preorder: Boolean(doc.isPreorder),
    preorder_ships_at: doc.preorderShipsAt
      ? new Date(doc.preorderShipsAt).toLocaleDateString("en-GB").replaceAll("/", ".")
      : null,
    is_new: Boolean(doc.isNew),
    composition: doc.composition ?? "",
    set_parts: (doc.setParts ?? []).length > 0 ? doc.setParts!.map((part) => part.value) : null,
    description: doc.description ?? "",
    features: (doc.features ?? []).map((feature) => feature.value).filter(Boolean),
    images,
  };
}

export const getProducts = cache(async (locale: Locale): Promise<Product[]> => {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "products",
    locale,
    where: { isActive: { equals: true } },
    sort: "_order",
    depth: 2,
    ...ALL,
  });
  // Colour and fabric slugs come from the default language, as in the source
  // shop, so ?color=qehveyi keeps working once the names are translated.
  const base =
    locale === defaultLocale
      ? result
      : await payload.find({
          collection: "products",
          locale: defaultLocale,
          select: { colorName: true, fabric: true },
          ...ALL,
        });
  const names = new Map(base.docs.map((doc) => [doc.id, doc]));
  return result.docs.map((doc) => {
    const az = names.get(doc.id) ?? doc;
    return toProduct(doc, { color: slugify(az.colorName ?? ""), fabric: slugify(az.fabric ?? "") }, locale);
  });
});

export const getCategories = cache(async (locale: Locale): Promise<Category[]> => {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "categories",
    locale,
    where: { isActive: { equals: true } },
    sort: "_order",
    depth: 1,
    ...ALL,
  });

  return result.docs.map((doc: CmsCategory) => ({
    slug: doc.slug,
    name: doc.name,
    labelKey: null,
    parent: resolve(doc.parent)?.slug ?? null,
    description: doc.description ?? null,
  }));
});

export const getSiteTexts = cache(async (locale: Locale): Promise<Record<string, string>> => {
  const payload = await payloadClient();
  const result = await payload.find({ collection: "site-texts", ...ALL });

  return Object.fromEntries(
    result.docs.map((doc: SiteText) => [doc.key, doc[locale] || doc.az]),
  );
});

export const getSettings = cache(async (locale: Locale): Promise<Setting> => {
  const payload = await payloadClient();
  return payload.findGlobal({ slug: "settings", locale });
});

export const getBrand = cache(async (locale: Locale): Promise<Brand> => {
  const payload = await payloadClient();
  return payload.findGlobal({ slug: "brand", locale });
});

export const getShop = cache(async (locale: Locale): Promise<ShopSettings> => {
  const [settings, categories, pages, postCount] = await Promise.all([
    getSettings(locale),
    getCategories(locale),
    getFooterPages(locale),
    countPosts(),
  ]);

  const roots = categories.filter((c) => c.parent === null);
  const navigation: NavItem[] = [
    { labelKey: "nav.new_in", url: "/collections/new-in", children: [] },
    ...roots.map((root) => ({
      label: root.name ?? root.slug,
      url: `/collections/${root.slug}`,
      children: categories
        .filter((child) => child.parent === root.slug)
        .map((child) => ({ label: child.name ?? child.slug, url: `/collections/${child.slug}` })),
    })),
    { labelKey: "nav.all_products", url: "/collections/all-products", children: [] },
    ...(postCount > 0 ? [{ labelKey: "nav.blog", url: "/blog", children: [] }] : []),
  ];

  const group = (name: "company" | "help", titleKey: string): FooterGroup => {
    const links: NavItem[] = pages
      .filter((page) => page.footerGroup === name)
      .map((page) => ({ label: page.title, url: `/pages/${page.slug}` }));

    // Contact is a form rather than CMS content, so it is spliced into the
    // company column just after the first page, as in the source shop.
    if (name === "company") {
      links.splice(1, 0, { labelKey: "nav.contact", url: "/contact" });
    }
    return { titleKey, links };
  };

  return {
    name: settings.shopName ?? "Hystlovers",
    currency: { code: settings.currencyCode ?? "AZN", symbol: settings.currencySymbol ?? "₼" },
    freeShippingThreshold: Number(settings.freeShippingThreshold ?? 0),
    shippingFee: Number(settings.shippingFee ?? 0),
    navigation,
    footer: [group("company", "footer.group.company"), group("help", "footer.group.help")],
  };
});

const getFooterPages = cache(async (locale: Locale) => {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "pages",
    locale,
    where: { isActive: { equals: true } },
    sort: "_order",
    ...ALL,
  });
  return result.docs.map((doc: CmsPage) => ({
    slug: doc.slug,
    title: doc.title,
    footerGroup: doc.footerGroup ?? null,
  }));
});

const countPosts = cache(async () => {
  const payload = await payloadClient();
  const result = await payload.count({
    collection: "posts",
    where: { isActive: { equals: true }, publishedAt: { less_than_equal: new Date().toISOString() } },
  });
  return result.totalDocs;
});

export const getSlides = cache(async (locale: Locale): Promise<Slide[]> => {
  const payload = await payloadClient();
  const now = new Date().toISOString();
  const result = await payload.find({
    collection: "slides",
    locale,
    where: {
      isActive: { equals: true },
      or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }],
    },
    sort: "_order",
    depth: 1,
    ...ALL,
  });

  return result.docs
    .filter((doc: CmsSlide) => !doc.endsAt || new Date(doc.endsAt) >= new Date())
    .map((doc: CmsSlide) => ({
      title: doc.title ?? "",
      subtitle: doc.subtitle ?? "",
      cta: doc.ctaLabel ?? "",
      url: doc.ctaUrl ?? "/collections/all-products",
      image: mediaUrl(doc.image) ?? "",
      imageMobile: mediaUrl(doc.imageMobile),
    }))
    .filter((slide) => slide.image);
});

export const getHomeSections = cache(async (locale: Locale) => {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "home-sections",
    locale,
    where: { isActive: { equals: true } },
    sort: "_order",
    depth: 1,
    ...ALL,
  });

  const products = await getProducts(locale);
  const categories = await getCategories(locale);

  return result.docs.map((doc: HomeSection) => {
    const category = resolve(doc.category);
    const slug = category?.slug ?? "";
    return {
      title: doc.title || category?.name || slug,
      url: `/collections/${slug}`,
      products: filterByCategory(products, categories, slug).slice(0, doc.productLimit ?? 8),
    };
  });
});

/** Products in a category or any of its descendants. */
export function filterByCategory(products: Product[], categories: Category[], slug: string): Product[] {
  const descendants = new Set([slug]);
  let frontier = [slug];
  while (frontier.length > 0) {
    const next = categories.filter((c) => c.parent && frontier.includes(c.parent)).map((c) => c.slug);
    frontier = next.filter((s) => !descendants.has(s));
    frontier.forEach((s) => descendants.add(s));
  }
  return products.filter((p) => descendants.has(p.category_slug));
}

export const getPosts = cache(async (locale: Locale): Promise<BlogPost[]> => {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "posts",
    locale,
    where: { isActive: { equals: true }, publishedAt: { less_than_equal: new Date().toISOString() } },
    sort: "-publishedAt",
    depth: 1,
    ...ALL,
  });

  return result.docs.map((doc: CmsPost) => ({
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt ?? "",
    cover: mediaUrl(doc.coverImage),
    url: `/blog/${doc.slug}`,
    publishedAt: doc.publishedAt
      ? new Date(doc.publishedAt).toLocaleDateString("en-GB").replaceAll("/", ".")
      : "",
    publishedAtIso: doc.publishedAt ? String(doc.publishedAt).slice(0, 10) : "",
    images: (doc.images ?? [])
      .map((row) => mediaUrl(row.image))
      .filter((url): url is string => Boolean(url)),
    lexical: doc.body ?? null,
  })) as BlogPost[];
});

export const getStaticPages = cache(async (locale: Locale): Promise<(StaticPage & { slug: string })[]> => {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "pages",
    locale,
    where: { isActive: { equals: true } },
    sort: "_order",
    ...ALL,
  });

  return result.docs.map((doc: CmsPage) => ({
    slug: doc.slug,
    title: doc.title,
    body: "",
    lexical: doc.body,
  }));
});

export const getContactDetails = cache(async (locale: Locale): Promise<ContactDetails> => {
  const settings = await getSettings(locale);
  const socials = [
    settings.instagram ? { name: "Instagram", handle: settings.instagram } : null,
    settings.facebook ? { name: "Facebook", handle: settings.facebook } : null,
    settings.tiktok ? { name: "TikTok", handle: settings.tiktok } : null,
    settings.x ? { name: "X", handle: settings.x } : null,
  ].filter(Boolean) as { name: string; handle: string }[];

  return {
    email: settings.contactEmail ?? null,
    phone: settings.contactPhone ?? null,
    whatsapp: settings.contactWhatsapp ?? null,
    address: settings.contactAddress ?? null,
    workingHours: settings.workingHours ?? null,
    socials,
  };
});

export type PaletteColor = Product["color"] & { showInFilter: boolean };
export type PaletteFabric = { slug: string; name: string; showInFilter: boolean };
export type FilterPalette = { colors: PaletteColor[]; fabrics: PaletteFabric[] };

/** The filter's colours and fabrics as arranged in the panel (Shop → Colors, Shop → Fabrics). */
export const getFilterPalette = cache(async (locale: Locale): Promise<FilterPalette> => {
  const payload = await payloadClient();
  const [colors, fabrics] = await Promise.all([
    payload.find({ collection: "colors", locale, sort: "_order", depth: 0, ...ALL }),
    payload.find({ collection: "fabrics", locale, sort: "_order", depth: 0, ...ALL }),
  ]);
  return {
    colors: colors.docs.map((doc) => ({
      slug: doc.slug,
      name: doc.name,
      hex: doc.hex,
      showInFilter: doc.showInFilter !== false,
    })),
    fabrics: fabrics.docs.map((doc) => ({ slug: doc.slug, name: doc.name, showInFilter: doc.showInFilter !== false })),
  };
});

/**
 * Swatches follow the panel's palette: its order, names and colours, minus the
 * ones switched off. A colour the palette lacks still shows, from the product.
 */
function filterColors(pool: Map<string, Product["color"]>, palette: PaletteColor[]): Product["color"][] {
  const known = new Set(palette.map((color) => color.slug));
  return [
    ...palette
      .filter((color) => color.showInFilter && pool.has(color.slug))
      .map(({ slug, name, hex }) => ({ slug, name, hex })),
    ...[...pool.values()].filter((color) => !known.has(color.slug)),
  ];
}

/** Fabrics follow the panel the same way; one it lacks still shows, sorted by name. */
function filterFabrics(pool: Map<string, string>, palette: PaletteFabric[]): FilterOption[] {
  const known = new Set(palette.map((fabric) => fabric.slug));
  return [
    ...palette
      .filter((fabric) => fabric.showInFilter && pool.has(fabric.slug))
      .map(({ slug, name }) => ({ value: slug, label: name })),
    ...[...pool]
      .filter(([slug]) => !known.has(slug))
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];
}

export function buildFacets(pool: Product[], palette: FilterPalette = { colors: [], fabrics: [] }): Facets {
  const colors = new Map<string, Product["color"]>();
  const sizes = new Set<string>();
  const fabrics = new Map<string, string>();
  const cats = new Set<string>();
  let priceMax = 0;

  for (const p of pool) {
    colors.set(p.color.slug, p.color);
    p.sizes.forEach((s) => sizes.add(s));
    if (p.fabric_slug) fabrics.set(p.fabric_slug, p.fabric);
    if (p.category) cats.add(p.category);
    priceMax = Math.max(priceMax, p.price);
  }

  return {
    categories: [...cats].sort(),
    fabrics: filterFabrics(fabrics, palette.fabrics),
    colors: filterColors(colors, palette.colors),
    sizes: [...sizes],
    priceMax: Math.ceil(priceMax),
  };
}

export function getSiblings(products: Product[], product: Product): ProductSibling[] {
  return products
    .filter((p) => p.series === product.series && p.item === product.item)
    .map(({ slug, color, in_stock }) => ({ slug, color, in_stock }));
}

/** Same series, category or colour — weighted, one entry per garment. */
export function getRelated(products: Product[], product: Product, limit = 4): Product[] {
  const scored = products
    .filter(
      (p) =>
        p.slug !== product.slug &&
        (p.series === product.series ||
          p.category_slug === product.category_slug ||
          p.color.slug === product.color.slug),
    )
    .map((p) => ({
      product: p,
      score: (p.series === product.series ? 2 : 0) + (p.color.slug === product.color.slug ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: Product[] = [];
  for (const { product: p } of scored) {
    const garment = `${p.series}${p.item}`;
    if (seen.has(garment)) continue;
    seen.add(garment);
    out.push(p);
    if (out.length === limit) break;
  }
  return out;
}
