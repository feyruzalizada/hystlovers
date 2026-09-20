import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { renderRichText } from "@/lib/richtext";
import { localeAlternates } from "@/lib/alternates";
import { isLocale, localePath, locales } from "@/lib/i18n";

export async function generateStaticParams() {
  const posts = await getPosts("az");
  return locales.flatMap((locale) => posts.map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = (await getPosts(locale)).find((entry) => entry.slug === slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: localeAlternates(`/blog/${slug}`),
    openGraph: {
      title: post.title,
      type: "article",
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const posts = await getPosts(locale);
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) notFound();

  const t = await getTranslator(locale);
  const more = posts.filter((entry) => entry.slug !== post.slug).slice(0, 3);

  return (
    <>
      <article className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
        <header className="text-center">
          {post.publishedAtIso && (
            <time
              dateTime={post.publishedAtIso}
              className="text-[11px] tracking-wide2 text-ink/40 uppercase"
            >
              {post.publishedAt}
            </time>
          )}
          <h1 className="heading-brand mt-3 text-2xl leading-snug sm:text-3xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-sm leading-relaxed text-ink/60">{post.excerpt}</p>}
        </header>

        {post.cover && (
          <Image
            src={post.cover}
            alt={post.title}
            width={1200}
            height={800}
            priority
            className="mt-10 w-full bg-mist object-cover"
          />
        )}

        <div
          className="page-body mt-10 text-sm leading-relaxed text-ink/75 sm:text-base"
          dangerouslySetInnerHTML={{ __html: renderRichText(post.lexical) }}
        />

        {post.images.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {post.images.map((image) => (
              <Image
                key={image}
                src={image}
                alt={post.title}
                width={800}
                height={1000}
                className="w-full bg-mist object-cover"
              />
            ))}
          </div>
        )}

        <Link href={localePath(locale, "/blog")} className="btn-ghost mt-12 inline-block text-xs">
          {t("blog.back")}
        </Link>
      </article>

      {more.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="heading-brand text-lg sm:text-xl">{t("blog.more_heading")}</h2>
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-3">
              {more.map((item) => (
                <Link key={item.slug} href={localePath(locale, item.url)} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-mist">
                    {item.cover && (
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="mt-3 text-xs tracking-wide2 uppercase">{item.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
