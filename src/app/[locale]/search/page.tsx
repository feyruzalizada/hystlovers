import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SearchView from "@/components/SearchView";
import { getProducts } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { isLocale } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { q } = await searchParams;
  const t = await getTranslator(locale);
  return { title: q ? t("search.results_title", { query: q }) : t("search.title") };
}

/** Case-insensitive match over the columns the PHP scope searched. */
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
  const products = await getProducts(locale);

  return <SearchView query={q} results={search(products, q)} />;
}
