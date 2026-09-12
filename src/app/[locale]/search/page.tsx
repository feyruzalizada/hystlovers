import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import { searchProducts } from "@/lib/data";
import { createTranslator, isLocale, localePath } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("search.title") };
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
  const t = createTranslator(locale);
  const results = searchProducts(q);

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
