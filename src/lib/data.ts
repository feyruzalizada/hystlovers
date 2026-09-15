import productsJson from "@/data/products.json";
import categoriesJson from "@/data/categories.json";
import shopJson from "@/data/shop.json";
import slidesJson from "@/data/slides.json";
import colorTilesJson from "@/data/colorTiles.json";
import featuredJson from "@/data/featured.json";
import pagesJson from "@/data/pages.json";
import postsJson from "@/data/posts.json";
import contactJson from "@/data/contact.json";
import type {
  BlogPost,
  Category,
  CollectionFilters,
  Color,
  ColorTile,
  ContactDetails,
  Facets,
  Locale,
  Product,
  ProductSibling,
  ShopSettings,
  Slide,
  SortKey,
  StaticPage,
} from "./types";

export const PER_PAGE = 12;

const products = productsJson as Product[];
const categories = categoriesJson as Category[];

export function getShop(): ShopSettings {
  return shopJson as ShopSettings;
}

export function getSlides(): Slide[] {
  return slidesJson as Slide[];
}

export function getColorTiles(): ColorTile[] {
  return colorTilesJson as ColorTile[];
}

export function getContact(): { details: ContactDetails; subjects: string[] } {
  return contactJson as { details: ContactDetails; subjects: string[] };
}

export function getCategories(): Category[] {
  return categories;
}

export function getCategory(slug: string): Category | null {
  return categories.find((c) => c.slug === slug) ?? null;
}

export function getSubcategories(slug: string): Category[] {
  return categories.filter((c) => c.parent === slug);
}

function inCollection(product: Product, slug: string): boolean {
  switch (slug) {
    case "all-products":
      return true;
    case "new-in":
      return product.is_new;
    case "sets":
      return product.type === "set";
    case "single-pieces":
      return product.type === "single";
    default:
      return product.category_slug === slug;
  }
}

export function getCollectionProducts(slug: string): Product[] {
  return products.filter((p) => inCollection(p, slug));
}

export function buildFacets(pool: Product[]): Facets {
  const colors = new Map<string, Color>();
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

const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
  featured: () => 0,
  newest: (a, b) => Number(b.is_new) - Number(a.is_new),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  name_asc: (a, b) => a.name.localeCompare(b.name),
  name_desc: (a, b) => b.name.localeCompare(a.name),
};

export function applyFilters(pool: Product[], filters: CollectionFilters) {
  let list = pool.filter((p) => {
    if (filters.category?.length && !filters.category.includes(p.category)) return false;
    if (filters.color?.length && !filters.color.includes(p.color.slug)) return false;
    if (filters.fabric?.length && !filters.fabric.includes(p.fabric)) return false;
    if (filters.size?.length && !filters.size.some((s) => p.sizes.includes(s))) return false;
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
    if (filters.inStockOnly && !p.in_stock) return false;
    return true;
  });

  list = [...list].sort(sorters[filters.sort ?? "featured"]);

  const page = Math.max(1, filters.page ?? 1);
  const lastPage = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;

  return {
    items: list.slice(start, start + PER_PAGE),
    total: list.length,
    page,
    lastPage,
  };
}

export function getProduct(slug: string): Product | null {
  return products.find((p) => p.slug === slug) ?? null;
}

export function getSiblings(product: Product): ProductSibling[] {
  return products
    .filter((p) => p.series === product.series && p.item === product.item)
    .map(({ slug, color, in_stock }) => ({ slug, color, in_stock }));
}

export function getRelated(product: Product, limit = 4): Product[] {
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

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter((p) =>
    [p.name, p.series, p.item, p.category, p.fabric, p.color.name]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q)),
  );
}

/** Series landing pages: /collections/kai resolves to every KAI product. */
export function getSeriesProducts(slug: string): Product[] {
  const series = slug.replaceAll("-", " ").toLowerCase();
  return products.filter((p) => p.series.toLowerCase() === series);
}

export function getSeriesName(slug: string): string | null {
  return getSeriesProducts(slug)[0]?.series ?? null;
}

export function getSeriesSlugs(): string[] {
  return [...new Set(products.map((p) => p.series.toLowerCase().replaceAll(" ", "-")))];
}

export function countInCollection(slug: string): number {
  return getCollectionProducts(slug).length;
}

export function getFeaturedBlocks() {
  return (featuredJson as { title: string; url: string }[]).map((block) => {
    const slug = block.url.split("/collections/")[1] ?? "";
    return { ...block, products: getCollectionProducts(slug).slice(0, 4) };
  });
}

export function getNewIn(limit = 8): Product[] {
  return getCollectionProducts("new-in").slice(0, limit);
}

export function getPosts(locale: Locale): BlogPost[] {
  const byLocale = postsJson as Record<string, Record<string, BlogPost>>;
  return Object.values(byLocale)
    .map((entry) => entry[locale] ?? entry.en)
    .filter(Boolean)
    .sort((a, b) => b.publishedAtIso.localeCompare(a.publishedAtIso));
}

export function getPost(locale: Locale, slug: string): BlogPost | null {
  const byLocale = postsJson as Record<string, Record<string, BlogPost>>;
  const entry = Object.values(byLocale).find((p) =>
    Object.values(p).some((variant) => variant.slug === slug),
  );
  if (!entry) return null;
  return entry[locale] ?? entry.en ?? null;
}

export function getStaticPage(locale: Locale, slug: string): StaticPage | null {
  const byLocale = pagesJson as Record<string, Record<string, StaticPage>>;
  const entry = byLocale[slug];
  if (!entry) return null;
  return entry[locale] ?? entry.en ?? null;
}

export function getStaticPageSlugs(): string[] {
  return Object.keys(pagesJson as Record<string, unknown>);
}

export function getProductSlugs(): string[] {
  return products.map((p) => p.slug);
}

export function getCollectionSlugs(): string[] {
  return categories.map((c) => c.slug);
}

export function getPostSlugs(locale: Locale): string[] {
  return getPosts(locale).map((p) => p.slug);
}
