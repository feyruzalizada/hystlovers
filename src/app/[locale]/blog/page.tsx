import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
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
  return { title: t("blog.title"), description: t("blog.meta_description") };
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
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8">
      <header className="mb-12 text-center">
        <h1 className="heading-brand text-xl">{t("blog.title")}</h1>
        <p className="mt-3 text-sm text-ink-soft">{t("blog.subtitle")}</p>
      </header>

      {posts.length === 0 ? (
        <p className="py-20 text-center text-sm text-ink-soft">{t("blog.empty")}</p>
      ) : (
        <div className="grid gap-10 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.slug} className="flex flex-col">
              <Link href={localePath(locale, `/blog/${post.slug}`)}>
                <div className="relative aspect-[4/3] bg-mist">
                  {post.cover && (
                    <Image
                      src={post.cover}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  )}
                </div>
              </Link>
              <time
                className="mt-5 text-xs tracking-brand text-ink-soft uppercase"
                dateTime={post.publishedAtIso}
              >
                {post.publishedAt}
              </time>
              <h2 className="heading-brand mt-2 text-sm">
                <Link href={localePath(locale, `/blog/${post.slug}`)}>{post.title}</Link>
              </h2>
              <p className="mt-3 text-sm text-ink-soft">{post.excerpt}</p>
              <Link
                href={localePath(locale, `/blog/${post.slug}`)}
                className="btn-ghost mt-5 self-start"
              >
                {t("blog.read_more")}
              </Link>
            </article>
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <nav className="mt-16 flex items-center justify-center gap-6 border-t border-line pt-8">
          {page > 1 && (
            <Link href={href(page - 1)} className="btn-ghost">
              {t("blog.prev")}
            </Link>
          )}
          <span className="text-xs tracking-brand text-ink-soft uppercase">
            {page} / {lastPage}
          </span>
          {page < lastPage && (
            <Link href={href(page + 1)} className="btn-ghost">
              {t("blog.next")}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
