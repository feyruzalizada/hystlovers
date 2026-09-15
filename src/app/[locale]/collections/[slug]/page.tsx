import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CollectionToolbar from "@/components/CollectionToolbar";
import ProductGrid from "@/components/ProductGrid";
import { buildFacets, filterByCategory, getCategories, getProducts } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { isLocale, localePath } from "@/lib/i18n";
import { applyFilters } from "@/lib/filters";
import type { CollectionFilters, Locale, Product, SortKey } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

function asArray(value: string | string[] | undefined): string[] | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value : [value];
}

/**
 * A slug is a catalog-wide collection, a category, or — when it matches no
 * category — a series landing page such as /collections/kai.
 */
async function resolveCollection(slug: string, locale: Locale) {
  const [t, products, categories] = await Promise.all([
    getTranslator(locale),
    getProducts(locale),
    getCategories(locale),
  ]);

  if (slug === "all-products" || slug === "new-in") {
    const key = `collection.${slug.replaceAll("-", "_")}`;
    return {
      name: t(`${key}.title`),
      description: t(`${key}.description`),
      products: slug === "new-in" ? products.filter((p) => p.is_new) : products,
      subcategories: [],
      counts: {} as Record<string, number>,
    };
  }

  const category = categories.find((c) => c.slug === slug);
  if (category) {
    const subcategories = categories.filter((c) => c.parent === slug);
    return {
      name: category.name ?? slug,
      description: category.description ?? null,
      products: filterByCategory(products, categories, slug),
      subcategories,
      counts: Object.fromEntries(
        subcategories.map((child) => [
          child.slug,
          filterByCategory(products, categories, child.slug).length,
        ]),
      ),
    };
  }

  const series = slug.replaceAll("-", " ").toLowerCase();
  const inSeries = products.filter((p) => p.series.toLowerCase() === series);
  if (inSeries.length === 0) return null;

  return {
    name: inSeries[0].series,
    description: t("collection.series_description", { series: inSeries[0].series }),
    products: inSeries,
    subcategories: [],
    counts: {} as Record<string, number>,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const collection = await resolveCollection(slug, locale);
  return collection ? { title: collection.name } : {};
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const collection = await resolveCollection(slug, locale);
  if (!collection) notFound();

  const query = await searchParams;
  const t = await getTranslator(locale);
  const path = (p: string) => localePath(locale, p);

  const filters: CollectionFilters = {
    category: asArray(query.category),
    color: asArray(query.color),
    size: asArray(query.size),
    fabric: asArray(query.fabric),
    maxPrice: query.max_price ? Number(query.max_price) : undefined,
    inStockOnly: query.in_stock === "1",
    sort: (query.sort as SortKey) ?? "featured",
    page: query.page ? Number(query.page) : 1,
  };

  const pool: Product[] = collection.products;
  const facets = buildFacets(pool);
  const { items, total, page, lastPage } = applyFilters(pool, filters);

  function pageHref(target: number) {
    const next = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (key === "page" || value == null) return;
      (Array.isArray(value) ? value : [value]).forEach((v) => next.append(key, v));
    });
    if (target > 1) next.set("page", String(target));
    return `${path(`/collections/${slug}`)}${next.toString() ? `?${next}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8">
      <header className="mb-8 text-center">
        <h1 className="heading-brand text-xl">{collection.name}</h1>
        {collection.description && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft">{collection.description}</p>
        )}
      </header>

      {collection.subcategories.length > 0 && (
        <nav className="mb-8 flex flex-wrap justify-center gap-3">
          {collection.subcategories.map((child) => (
            <Link
              key={child.slug}
              href={path(`/collections/${child.slug}`)}
              className="border border-line px-4 py-2 text-xs tracking-brand uppercase hover:border-ink"
            >
              {child.name} <span className="text-ink-soft">({collection.counts[child.slug] ?? 0})</span>
            </Link>
          ))}
        </nav>
      )}

      <CollectionToolbar facets={facets} total={total} />

      <div className="py-10">
        {items.length > 0 ? (
          <ProductGrid products={items} />
        ) : (
          <p className="py-20 text-center text-sm text-ink-soft">{t("collection.empty")}</p>
        )}
      </div>

      {lastPage > 1 && (
        <nav
          aria-label={t("collection.pagination")}
          className="flex items-center justify-center gap-6 border-t border-line pt-8"
        >
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="btn-ghost">
              {t("collection.prev_page")}
            </Link>
          )}
          <span className="text-xs tracking-brand text-ink-soft uppercase">
            {page} / {lastPage}
          </span>
          {page < lastPage && (
            <Link href={pageHref(page + 1)} className="btn-ghost">
              {t("collection.next_page")}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
