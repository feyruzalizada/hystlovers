import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { getProducts, getRelated, getSiblings } from "@/lib/cms";
import { localeAlternates } from "@/lib/alternates";
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
  return product
    ? {
        title: product.name,
        description: product.description,
        alternates: localeAlternates(`/products/${slug}`),
      }
    : {};
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

  return (
    <ProductDetail
      product={product}
      siblings={getSiblings(products, product)}
      related={getRelated(products, product)}
    />
  );
}
