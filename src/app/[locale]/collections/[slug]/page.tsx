import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CollectionToolbar from "@/components/CollectionToolbar";
import ProductGrid from "@/components/ProductGrid";
import {
  applyFilters,
  buildFacets,
  getCategory,
  getCollectionProducts,
  getSubcategories,
} from "@/lib/data";
import { createTranslator, isLocale, localePath } from "@/lib/i18n";
import type { CollectionFilters, Locale, SortKey } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

function asArray(value: string | string[] | undefined): string[] | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value : [value];
}

function collectionTitle(slug: string, locale: Locale) {
  const t = createTranslator(locale);
  const category = getCategory(slug);
  if (!category) return null;
  if (category.labelKey) return t(category.labelKey);
  const key = `collection.${slug.replaceAll("-", "_")}.title`;
  const translated = t(key);
  return translated === key ? (category.name ?? slug) : translated;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  return { title: collectionTitle(slug, locale) ?? slug };
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

  const category = getCategory(slug);
  if (!category) notFound();

  const query = await searchParams;
  const t = createTranslator(locale);
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

  const pool = getCollectionProducts(slug);
  const facets = buildFacets(pool);
  const { items, total, page, lastPage } = applyFilters(pool, filters);
  const subcategories = getSubcategories(slug);

  const descriptionKey = `collection.${slug.replaceAll("-", "_")}.description`;
  const description = t(descriptionKey);

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
        <h1 className="heading-brand text-xl">{collectionTitle(slug, locale)}</h1>
        {description !== descriptionKey && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft">{description}</p>
        )}
      </header>

      {subcategories.length > 0 && (
        <nav className="mb-8 flex flex-wrap justify-center gap-3">
          {subcategories.map((child) => (
            <Link
              key={child.slug}
              href={path(`/collections/${child.slug}`)}
              className="border border-line px-4 py-2 text-xs tracking-brand uppercase hover:border-ink"
            >
              {child.name}
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
