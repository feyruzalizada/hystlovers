import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import { getColorTiles, getHomeSections, getProducts, getSlides } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { isLocale, localePath } from "@/lib/i18n";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [t, slides, products, colorTiles, sections] = await Promise.all([
    getTranslator(locale),
    getSlides(),
    getProducts(locale),
    getColorTiles(locale),
    getHomeSections(locale),
  ]);

  const path = (p: string) => localePath(locale, p);
  const newIn = products.filter((product) => product.is_new).slice(0, 8);
  const featured = sections.filter((section) => section.products.length > 0);

  return (
    <>
      <Hero slides={slides} />

      <section className="mx-auto max-w-[1400px] px-4 py-20 text-center md:px-8">
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-ink-soft">{t("home.manifesto")}</p>
      </section>

      {newIn.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 md:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="heading-brand text-sm">{t("home.new_in_heading")}</h2>
            <Link href={path("/collections/new-in")} className="btn-ghost">
              {t("home.view_all")}
            </Link>
          </div>
          <ProductGrid products={newIn} />
        </section>
      )}

      {colorTiles.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {colorTiles.map((tile) => (
              <Link key={tile.slug} href={path(tile.url)} className="group">
                <div className="relative aspect-square overflow-hidden bg-mist">
                  <Image
                    src={tile.image}
                    alt={tile.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 16vw"
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 border border-line"
                    style={{ backgroundColor: tile.hex }}
                  />
                  <span className="text-xs tracking-brand uppercase">{tile.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.map((block) => (
        <section key={block.url} className="mx-auto max-w-[1400px] px-4 pb-20 md:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="heading-brand text-sm">{block.title}</h2>
            <Link href={path(block.url)} className="btn-ghost">
              {t("home.view_all")}
            </Link>
          </div>
          <ProductGrid products={block.products} />
        </section>
      ))}
    </>
  );
}
