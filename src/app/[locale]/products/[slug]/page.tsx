import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductGrid from "@/components/ProductGrid";
import { getProduct, getProductSlugs, getRelated, getSiblings } from "@/lib/data";
import { createTranslator, isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) => getProductSlugs().map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return { title: product.name, description: product.description };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const product = getProduct(slug);
  if (!product) notFound();

  const t = createTranslator(locale);
  const related = getRelated(product);

  return (
    <>
      <ProductDetail product={product} siblings={getSiblings(product)} />

      {related.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 pb-20 md:px-8">
          <h2 className="heading-brand mb-8 text-sm">{t("product.related_heading")}</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
