import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductGrid from "@/components/ProductGrid";
import { getProducts, getRelated, getSiblings } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { isLocale, locales } from "@/lib/i18n";

export async function generateStaticParams() {
  const products = await getProducts("az");
  return locales.flatMap((locale) => products.map((product) => ({ locale, slug: product.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = (await getProducts(locale)).find((p) => p.slug === slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const products = await getProducts(locale);
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const t = await getTranslator(locale);
  const related = getRelated(products, product);

  return (
    <>
      <ProductDetail product={product} siblings={getSiblings(products, product)} />

      {related.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 pb-20 md:px-8">
          <h2 className="heading-brand mb-8 text-sm">{t("product.related_heading")}</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
