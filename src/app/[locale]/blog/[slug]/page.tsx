import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { renderRichText } from "@/lib/richtext";
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
  const post = (await getPosts(locale)).find((p) => p.slug === slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const posts = await getPosts(locale);
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const t = await getTranslator(locale);
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <article className="mx-auto max-w-[760px] px-4 py-12 md:px-8">
      <Link href={localePath(locale, "/blog")} className="btn-ghost">
        {t("blog.back")}
      </Link>

      <header className="mt-10">
        <time
          className="text-xs tracking-brand text-ink-soft uppercase"
          dateTime={post.publishedAtIso}
        >
          {post.publishedAt}
        </time>
        <h1 className="heading-brand mt-3 text-2xl">{post.title}</h1>
      </header>

      <div
        className="page-body mt-10 text-sm leading-relaxed text-ink-soft"
        dangerouslySetInnerHTML={{ __html: renderRichText(post.lexical) }}
      />

      {more.length > 0 && (
        <section className="mt-20 border-t border-line pt-10">
          <h2 className="heading-brand text-sm">{t("blog.more_heading")}</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {more.map((item) => (
              <li key={item.slug}>
                <Link
                  href={localePath(locale, `/blog/${item.slug}`)}
                  className="text-sm hover:underline"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
