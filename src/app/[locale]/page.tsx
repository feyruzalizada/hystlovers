import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Hero from "@/components/Hero";
import NewInGrid from "@/components/NewInGrid";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { getBrand, getHomeSections, getProducts, getSlides } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { localeAlternates } from "@/lib/alternates";
import { isLocale, localePath } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return {
    // A title template only reaches child segments, so the home page spells the
    // suffix out the way the source shop's layout did.
    title: { absolute: `${t("home.title")} — Hystlovers` },
    description: t("home.meta_description"),
    alternates: localeAlternates("/"),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [t, slides, products, sections, brand] = await Promise.all([
    getTranslator(locale),
    getSlides(locale),
    getProducts(locale),
    getHomeSections(locale),
    getBrand(locale),
  ]);

  const featured = sections.filter((section) => section.products.length > 0);
  const newIn = products.filter((product) => product.is_new);

  return (
    <>
      <Hero slides={slides} />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <NewInGrid
          title={t("home.new_in_heading")}
          url="/collections/new-in"
          products={newIn.length > 0 ? newIn : products}
        />
      </section>

      {featured.map((block, index) => (
        <section key={block.url} className={index % 2 === 0 ? "bg-mist/60" : undefined}>
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <SectionHeading title={block.title} url={block.url} />
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
              {block.products.map((product, position) => (
                <ProductCard key={product.slug} product={product} priority={index === 0 && position < 4} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24">
        {brand.homeLabel && <p className="heading-brand text-sm text-ink/50">{brand.homeLabel}</p>}
        {brand.homeText && (
          <p className="mt-6 text-lg leading-relaxed font-light sm:text-2xl">{brand.homeText}</p>
        )}
        {brand.homeButton && brand.homeButtonUrl && (
          <Link
            href={brand.homeButtonUrl.startsWith("/") ? localePath(locale, brand.homeButtonUrl) : brand.homeButtonUrl}
            className="btn-ghost mt-8"
          >
            {brand.homeButton}
          </Link>
        )}
      </section>
    </>
  );
}
