import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ColorTiles from "@/components/ColorTiles";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { getColorTiles, getHomeSections, getSlides } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { isLocale, localePath } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("home.title"), description: t("home.meta_description") };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [t, slides, colorTiles, sections] = await Promise.all([
    getTranslator(locale),
    getSlides(),
    getColorTiles(locale),
    getHomeSections(locale),
  ]);

  const featured = sections.filter((section) => section.products.length > 0);

  return (
    <>
      <Hero slides={slides} />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeading title={t("home.new_in_heading")} url="/collections/new-in" />
        <ColorTiles tiles={colorTiles} />
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
        <p className="heading-brand text-sm text-ink/50">Hystlovers</p>
        <p className="mt-6 text-lg leading-relaxed font-light sm:text-2xl">{t("home.manifesto")}</p>
        <Link href={localePath(locale, "/pages/about-us")} className="btn-ghost mt-8">
          {t("home.story_cta")}
        </Link>
      </section>
    </>
  );
}
