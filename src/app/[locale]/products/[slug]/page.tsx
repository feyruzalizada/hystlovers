import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
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
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
          <SectionHeading title={t("product.related_heading")} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
