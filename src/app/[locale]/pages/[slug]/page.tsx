import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticPage, getStaticPageSlugs } from "@/lib/data";
import { isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) => getStaticPageSlugs().map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const page = getStaticPage(locale, slug);
  return page ? { title: page.title } : {};
}

export default async function StaticPageRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const page = getStaticPage(locale, slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-[760px] px-4 py-16 md:px-8">
      <h1 className="heading-brand text-xl">{page.title}</h1>
      <div
        className="page-body mt-10 text-sm leading-relaxed text-ink-soft"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </div>
  );
}
