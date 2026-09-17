import "server-only";
import { cache } from "react";
import { getPayload, type Payload } from "payload";
import config from "@payload-config";
import { slugify } from "./slug";
import type {
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
  ColorTile,
  ContactDetails,
  Facets,
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

/**
 * Payload returns absolute URLs once SERVER_URL is set; next/image only accepts
 * remote hosts that are allow-listed, and the files are served by this app
 * anyway, so they are reduced back to a path.
 */
function mediaUrl(value: Related<Media>): string | null {
  const url = resolve(value)?.url;
  if (!url) return null;
  if (!url.startsWith("http")) return url;
  const parsed = URL.parse(url);
  return parsed ? `${parsed.pathname}${parsed.search}` : url;
}

/** "LOVE T-SHIRT - BROWN (SHIRT, TROUSERS)" — the source shop's naming. */
function displayName(doc: CmsProduct): string {
  const setParts = (doc.setParts ?? []).map((part) => part.value).filter(Boolean);
  let name = `${doc.series} ${doc.item}`.toUpperCase() + " - " + String(doc.colorName ?? "").toUpperCase();
  if (setParts.length > 0) name += ` (${setParts.join(", ").toUpperCase()})`;
  return name;
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

function toProduct(doc: CmsProduct): Product {
  const sizes = (doc.sizes ?? []).map((entry) => entry.size);
  const category = resolve(doc.category);
  const images = (doc.images ?? [])
    .map((row) => mediaUrl(row.image))
    .filter((url): url is string => Boolean(url));

  // A single image is duplicated so the card's hover swap always has a partner.
  if (images.length === 1) images.push(images[0]);

  return {
    slug: doc.slug,
    name: displayName(doc),
    series: doc.series,
    item: doc.item,
    type: (doc.setParts ?? []).length > 0 ? "set" : "single",
    category: category?.name ?? "",
    category_slug: category?.slug ?? "",
    fabric: doc.fabric ?? "",
    price: Number(doc.price),
    compare_at: doc.compareAtPrice != null ? Number(doc.compareAtPrice) : null,
    color: { slug: slugify(doc.colorName ?? ""), name: doc.colorName ?? "", hex: doc.colorHex ?? "#000000" },
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
    sort: "sortOrder",
    depth: 2,
    ...ALL,
  });
  return result.docs.map(toProduct);
});

export const getCategories = cache(async (locale: Locale): Promise<Category[]> => {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "categories",
    locale,
    where: { isActive: { equals: true } },
    sort: "sortOrder",
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
    sort: "sortOrder",
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

export const getSlides = cache(async (): Promise<Slide[]> => {
  const payload = await payloadClient();
  const now = new Date().toISOString();
  const result = await payload.find({
    collection: "slides",
    where: {
      isActive: { equals: true },
      or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }],
    },
    sort: "sortOrder",
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

export const getColorTiles = cache(async (locale: Locale): Promise<ColorTile[]> => {
  const products = await getProducts(locale);
  const seen = new Map<string, ColorTile>();

  for (const product of products) {
    if (seen.has(product.color.slug)) continue;
    seen.set(product.color.slug, {
      ...product.color,
      url: `/collections/all-products?color=${product.color.slug}`,
      image: product.images[0] ?? "",
    });
  }
  return [...seen.values()].filter((tile) => tile.image);
});

export const getHomeSections = cache(async (locale: Locale) => {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "home-sections",
    locale,
    where: { isActive: { equals: true } },
    sort: "sortOrder",
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
    sort: "sortOrder",
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

export function buildFacets(pool: Product[]): Facets {
  const colors = new Map<string, Product["color"]>();
  const sizes = new Set<string>();
  const fabrics = new Set<string>();
  const cats = new Set<string>();
  let priceMax = 0;

  for (const p of pool) {
    colors.set(p.color.slug, p.color);
    p.sizes.forEach((s) => sizes.add(s));
    if (p.fabric) fabrics.add(p.fabric);
    if (p.category) cats.add(p.category);
    priceMax = Math.max(priceMax, p.price);
  }

  return {
    categories: [...cats].sort(),
    fabrics: [...fabrics].sort(),
    colors: [...colors.values()],
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
