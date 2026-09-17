import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";
import { buildFacets, filterByCategory, getCategories, getProducts } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { isLocale, localePath, locales } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

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
      subcategories: [] as { name: string; url: string; count: number }[],
      parent: null,
    };
  }

  const category = categories.find((c) => c.slug === slug);
  if (category) {
    const parent = category.parent ? categories.find((c) => c.slug === category.parent) : null;

    return {
      name: category.name ?? slug,
      description: category.description ?? null,
      products: filterByCategory(products, categories, slug),
      subcategories: categories
        .filter((child) => child.parent === slug)
        .map((child) => ({
          name: child.name ?? child.slug,
          url: `/collections/${child.slug}`,
          count: filterByCategory(products, categories, child.slug).length,
        })),
      parent: parent ? { name: parent.name ?? parent.slug, url: `/collections/${parent.slug}` } : null,
    };
  }

  const series = slug.replaceAll("-", " ").toLowerCase();
  const inSeries = products.filter((p) => p.series.toLowerCase() === series);
  if (inSeries.length === 0) return null;

  return {
    name: inSeries[0].series,
    description: t("collection.series_description", { series: inSeries[0].series }),
    products: inSeries,
    subcategories: [] as { name: string; url: string; count: number }[],
    parent: null,
  };
}

export async function generateStaticParams() {
  const [categories, products] = await Promise.all([getCategories("az"), getProducts("az")]);
  const series = [...new Set(products.map((p) => p.series.toLowerCase().replaceAll(" ", "-")))];
  const slugs = ["all-products", "new-in", ...categories.map((c) => c.slug), ...series];

  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const collection = await resolveCollection(slug, locale);
  return collection
    ? { title: collection.name, description: collection.description ?? undefined }
    : {};
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ color?: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const collection = await resolveCollection(slug, locale);
  if (!collection) notFound();

  const { color } = await searchParams;
  const path = (p: string) => localePath(locale, p);

  // Facets come from the whole active catalogue, as in the source controller.
  const facets = buildFacets(await getProducts(locale));

  return (
    <>
      <header className="border-b border-line bg-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 sm:py-14">
          {collection.parent && (
            <nav
              aria-label="Breadcrumb"
              className="mb-3 text-[11px] tracking-brand text-ink/50 uppercase"
            >
              <Link href={path(collection.parent.url)} className="transition-colors hover:text-ink">
                {collection.parent.name}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-ink">{collection.name}</span>
            </nav>
          )}

          <h1 className="heading-brand text-2xl sm:text-3xl">{collection.name}</h1>
          {collection.description && (
            <p className="mx-auto mt-3 max-w-xl text-sm text-ink/60">{collection.description}</p>
          )}

          {collection.subcategories.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {collection.subcategories.map((sub) => (
                <Link
                  key={sub.url}
                  href={path(sub.url)}
                  className="border border-line-strong bg-paper px-4 py-2 text-[11px] tracking-brand uppercase transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                >
                  {sub.name}
                  <span className="ml-1 opacity-50">{sub.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <CollectionView products={collection.products} facets={facets} initialColor={color} />
    </>
  );
}
