import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { isLocale, localePath } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getTranslator(locale))("search.title") };
}

/** Case-insensitive match across the same fields the PHP app searched. */
function search(products: Product[], query: string): Product[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return products.filter((p) =>
    [p.series, p.item, p.color.name, p.fabric, p.composition, p.category]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(term)),
  );
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { q = "" } = await searchParams;
  const [t, products] = await Promise.all([getTranslator(locale), getProducts(locale)]);
  const results = search(products, q);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8">
      <h1 className="heading-brand text-xl">
        {q ? t("search.results_title", { query: q }) : t("search.title")}
      </h1>

      {q && (
        <p className="mt-3 text-sm text-ink-soft">
          {t("search.count", { query: q, count: results.length })}
        </p>
      )}

      <div className="mt-10">
        {results.length > 0 ? (
          <ProductGrid products={results} />
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm text-ink-soft">{t("search.empty")}</p>
            <Link
              href={localePath(locale, "/collections/all-products")}
              className="btn-secondary mt-6"
            >
              {t("nav.all_products")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
