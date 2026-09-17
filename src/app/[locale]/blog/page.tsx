import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { localeAlternates } from "@/lib/alternates";
import { isLocale, localePath, locales } from "@/lib/i18n";

const PER_PAGE = 9;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return {
    title: t("blog.title"),
    description: t("blog.meta_description"),
    alternates: localeAlternates("/blog"),
  };
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { page: rawPage } = await searchParams;
  const [t, all] = await Promise.all([getTranslator(locale), getPosts(locale)]);

  const page = Math.max(1, Number(rawPage ?? 1));
  const lastPage = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const posts = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const href = (target: number) =>
    `${localePath(locale, "/blog")}${target > 1 ? `?page=${target}` : ""}`;

  return (
    <>
      <header className="border-b border-line bg-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <h1 className="heading-brand text-2xl sm:text-3xl">{t("blog.title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink/60">{t("blog.subtitle")}</p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {posts.length === 0 ? (
          <p className="py-24 text-center text-sm text-ink/60">{t("blog.empty")}</p>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.slug}>
                <Link href={localePath(locale, post.url)} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-mist">
                    {post.cover && (
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  {post.publishedAtIso && (
                    <time
                      dateTime={post.publishedAtIso}
                      className="mt-4 block text-[11px] tracking-brand text-ink/40 uppercase"
                    >
                      {post.publishedAt}
                    </time>
                  )}
                  <h2 className="mt-2 text-sm tracking-brand uppercase">{post.title}</h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{post.excerpt}</p>
                  )}
                  <p className="mt-3 text-[11px] tracking-brand uppercase underline decoration-line-strong underline-offset-4 transition-colors group-hover:decoration-ink">
                    {t("blog.read_more")}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        )}

        {lastPage > 1 && (
          <nav className="mt-16 flex items-center justify-center gap-6 text-xs tracking-brand uppercase">
            {page > 1 && (
              <Link href={href(page - 1)} className="hover:opacity-60">
                {t("blog.prev")}
              </Link>
            )}
            <span className="text-ink/40">
              {page} / {lastPage}
            </span>
            {page < lastPage && (
              <Link href={href(page + 1)} className="hover:opacity-60">
                {t("blog.next")}
              </Link>
            )}
          </nav>
        )}
      </div>
    </>
  );
}
