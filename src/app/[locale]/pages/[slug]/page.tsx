import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticPages } from "@/lib/cms";
import { renderRichText } from "@/lib/richtext";
import { isLocale, locales } from "@/lib/i18n";

export async function generateStaticParams() {
  const pages = await getStaticPages("az");
  return locales.flatMap((locale) => pages.map((page) => ({ locale, slug: page.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const page = (await getStaticPages(locale)).find((entry) => entry.slug === slug);
  return page ? { title: page.title } : {};
}

export default async function StaticPageRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const page = (await getStaticPages(locale)).find((entry) => entry.slug === slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="heading-brand text-center text-2xl sm:text-3xl">{page.title}</h1>
      <div
        className="page-body mt-10 text-sm leading-relaxed text-ink/75 sm:text-base"
        dangerouslySetInnerHTML={{ __html: renderRichText(page.lexical) }}
      />
    </article>
  );
}
