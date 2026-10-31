import fs from "fs";
import path from "path";
import type { Payload } from "payload";
import { htmlToLexical } from "./html-to-lexical";
import { slugify } from "@/lib/slug";

const root = process.cwd();
const read = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(root, "src", "seed", file), "utf8")) as T;

const LOCALES = ["az", "en", "ru"] as const;
type Locale = (typeof LOCALES)[number];

type SeedProduct = {
  slug: string;
  name: string;
  series: string;
  item: string;
  category: string;
  category_slug: string;
  fabric: string;
  price: number;
  compare_at: number | null;
  color: { slug: string; name: string; hex: string };
  sizes: string[];
  size_stock: Record<string, { available: boolean; remaining: number | null }>;
  in_stock: boolean;
  is_preorder: boolean;
  preorder_ships_at: string | null;
  is_new: boolean;
  composition: string;
  set_parts: string[] | null;
  description: string;
  features: string[];
  images: string[];
};

/** One-off import of the content carried over from the PHP shop. */
export async function seed(payload: Payload) {
  const media = new Map<string, number>();

  const uploadImage = async (publicPath: string) => {
    if (!publicPath) return null;
    if (media.has(publicPath)) return media.get(publicPath)!;

    const file = path.join(root, "public", publicPath);
    if (!fs.existsSync(file)) {
      payload.logger.warn(`missing image ${publicPath}`);
      return null;
    }

    const created = await payload.create({
      collection: "media",
      data: { alt: path.basename(publicPath, path.extname(publicPath)) },
      filePath: file,
      // The source images already sit in public/media; without this every
      // re-seed would add a "-1" copy next to them.
      overwriteExistingFiles: true,
    });

    media.set(publicPath, created.id as number);
    return created.id;
  };

  // ---- media files in Blob ------------------------------------------------
  // A build without the Blob token records the images but leaves the files on
  // Vercel's throwaway disk; the next build with the token uploads them again.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const sources = ["storage/products", "storage/slides", "media"].map((dir) =>
      path.join(root, "public", dir),
    );
    const stored = await payload.find({ collection: "media", limit: 0, pagination: false, depth: 0 });
    let reuploaded = 0;
    for (const doc of stored.docs) {
      if (!doc.url || !doc.filename) continue;
      const head = await fetch(doc.url, { method: "HEAD" }).catch(() => null);
      if (head?.ok) continue;

      const stem = path.basename(doc.filename, path.extname(doc.filename));
      const file = sources
        .flatMap((dir) => [path.join(dir, `${stem}.png`), path.join(dir, doc.filename!)])
        .find((candidate) => fs.existsSync(candidate));
      if (!file) {
        payload.logger.warn(`no source for media ${doc.filename}`);
        continue;
      }
      await payload.update({ collection: "media", id: doc.id, data: {}, filePath: file, overwriteExistingFiles: true });
      reuploaded++;
    }
    if (reuploaded) payload.logger.info(`re-uploaded ${reuploaded} media files to Blob`);
  }

  // ---- admin user -------------------------------------------------------
  const email = process.env.ADMIN_EMAIL ?? "admin@hystlovers.com";
  // A build never plants the well-known dev password; without ADMIN_PASSWORD
  // the first administrator signs up on /admin instead.
  const password =
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? null : "hystlovers123");
  const existingUsers = await payload.count({ collection: "users" });
  if (existingUsers.totalDocs === 0 && password) {
    await payload.create({
      collection: "users",
      data: { email, password, name: "Administrator" },
    });
    payload.logger.info(`admin user created: ${email}`);
  }

  // ---- site texts -------------------------------------------------------
  const messages = Object.fromEntries(
    LOCALES.map((locale) => [locale, read<Record<string, string>>(`messages/${locale}.json`)]),
  ) as Record<Locale, Record<string, string>>;

  // Earlier seeded values that may be replaced; anything else was edited in the panel.
  const replaced = read<Record<string, Partial<Record<Locale, string[]>>>>("messages/replaced.json");
  // The source panel's editor hint per key, shown under the key in the list.
  const hints = read<Record<string, string>>("messages/hints.json");
  const stored = await payload.find({ collection: "site-texts", limit: 0, pagination: false, depth: 0 });
  const byKey = new Map(stored.docs.map((doc) => [doc.key, doc]));
  let textWrites = 0;

  for (const key of Object.keys(messages.az)) {
    const doc = byKey.get(key);
    if (!doc) {
      await payload.create({
        collection: "site-texts",
        data: {
          key,
          group: key.split(".")[0],
          az: messages.az[key],
          en: messages.en[key],
          ru: messages.ru[key],
          hint: hints[key],
        },
      });
      textWrites++;
      continue;
    }
    const data: Partial<Record<Locale | "hint", string>> = {};
    for (const locale of LOCALES) {
      const now = doc[locale];
      if (now === messages[locale][key]) continue;
      if (!now || replaced[key]?.[locale]?.includes(now)) data[locale] = messages[locale][key];
    }
    // A hint written in the panel stays.
    if (!doc.hint && hints[key]) data.hint = hints[key];
    if (Object.keys(data).length > 0) {
      await payload.update({ collection: "site-texts", id: doc.id, data });
      textWrites++;
    }
  }
  if (textWrites > 0) payload.logger.info(`site texts: ${textWrites} added or updated`);

  // ---- header, homepage & footer block -----------------------------------
  // These used to be site texts: a value still stored there moves over once, panel edits
  // included. Defaults only fill a fresh block, so a field emptied in the panel stays empty.
  const brand = await payload.findGlobal({ slug: "brand" });
  const defaults = read<Record<Locale, Record<string, string>>>("content/brand.json");
  const moved = {
    announcement: "general.announcement",
    homeText: "home.manifesto",
    homeButton: "home.story_cta",
    footerText: "footer.brand_text",
    newsletterTitle: "footer.newsletter.title",
  } as const;
  const pending = Object.values(moved).filter((key) => byKey.has(key));
  if (!brand.updatedAt || pending.length > 0) {
    for (const locale of LOCALES) {
      const data: Record<string, string> = brand.updatedAt ? {} : { homeLabel: "Hystlovers", footerTitle: "Hystlovers" };
      for (const [field, key] of Object.entries(moved)) {
        if (brand.updatedAt && !byKey.has(key)) continue;
        const value = byKey.get(key)?.[locale] || defaults[locale][key];
        if (value) data[field] = value;
      }
      await payload.updateGlobal({ slug: "brand", locale, data });
    }
    await payload.delete({ collection: "site-texts", where: { key: { in: pending } } });
  }

  // ---- settings ---------------------------------------------------------
  const shop = read<{
    currency: { code: string; symbol: string };
    freeShippingThreshold: number;
    shippingFee: number;
  }>("content/shop.json");
  const contact = read<{
    details: {
      email: string | null;
      phone: string | null;
      whatsapp: string | null;
      address: string | null;
      workingHours: string | null;
      socials: { name: string; handle: string }[];
    };
  }>("content/contact.json");

  const social = (name: string) =>
    contact.details.socials.find((s) => s.name.toLowerCase() === name)?.handle ?? null;

  // Only on the first run: every build seeds, and the panel owns these afterwards.
  const settings = await payload.findGlobal({ slug: "settings" });
  if (!settings.updatedAt) {
    await payload.updateGlobal({
      slug: "settings",
      data: {
        shopName: "Hystlovers",
        currencyCode: shop.currency.code,
        currencySymbol: shop.currency.symbol,
        freeShippingThreshold: shop.freeShippingThreshold,
        shippingFee: shop.shippingFee,
      },
    });
  }
  const contactDetails = await payload.findGlobal({ slug: "contact-details" });
  if (!contactDetails.updatedAt) {
    await payload.updateGlobal({
      slug: "contact-details",
      data: {
        contactEmail: contact.details.email,
        contactPhone: contact.details.phone,
        contactWhatsapp: contact.details.whatsapp,
        contactAddress: contact.details.address,
        workingHours: contact.details.workingHours,
        instagram: social("instagram"),
        facebook: social("facebook"),
        tiktok: social("tiktok"),
        x: social("x"),
      },
    });
  }

  // ---- categories -------------------------------------------------------
  const categorySeed = read<{ slug: string; name: string | null; parent: string | null }[]>(
    "content/categories.json",
  ).filter((c) => c.name); // new-in / all-products are virtual collections, not rows

  const categoryIds = new Map<string, number>();
  const existingCategories = await payload.count({ collection: "categories" });

  if (existingCategories.totalDocs === 0) {
    for (const pass of [null, "parent"]) {
      for (const category of categorySeed) {
        const isRoot = category.parent === null;
        if ((pass === null) !== isRoot) continue;

        const created = await payload.create({
          collection: "categories",
          locale: "az",
          data: {
            name: category.name!,
            slug: category.slug,
            parent: category.parent ? categoryIds.get(category.parent) : undefined,
            isActive: true,
          },
        });
        categoryIds.set(category.slug, created.id as number);
      }
    }
    payload.logger.info(`${categoryIds.size} categories imported`);
  } else {
    const all = await payload.find({ collection: "categories", limit: 100, pagination: false });
    all.docs.forEach((doc) => categoryIds.set(doc.slug, doc.id));
  }

  // The line under each category title, from the source shop. Only empty ones
  // are filled, so wording changed in the panel stays.
  const descriptions = read<Record<string, Record<Locale, string>>>("content/category-descriptions.json");
  let described = 0;
  for (const [slug, id] of categoryIds) {
    const text = descriptions[slug];
    if (!text) continue;
    for (const locale of LOCALES) {
      const doc = await payload.findByID({ collection: "categories", id, locale, fallbackLocale: false, depth: 0 });
      if (doc.description) continue;
      await payload.update({ collection: "categories", id, locale, data: { description: text[locale] } });
      described++;
    }
  }
  if (described > 0) payload.logger.info(`category descriptions: ${described} filled`);

  // ---- products ---------------------------------------------------------
  const products = read<SeedProduct[]>("content/products.json");
  const existingProducts = await payload.count({ collection: "products" });

  if (existingProducts.totalDocs === 0) {
    for (const product of products) {
      const images: { image: number }[] = [];
      for (const image of product.images) {
        const id = await uploadImage(image);
        if (id) images.push({ image: id });
      }

      await payload.create({
        collection: "products",
        locale: "az",
        data: {
          series: product.series,
          item: product.item,
          slug: product.slug,
          category: categoryIds.get(product.category_slug),
          colorName: product.color.name,
          colorHex: product.color.hex,
          price: product.price,
          compareAtPrice: product.compare_at,
          fabric: product.fabric,
          composition: product.composition,
          description: product.description,
          sizes: product.sizes.map((size) => ({
            size,
            quantity: product.size_stock[size]?.remaining ?? null,
          })),
          features: product.features.map((value) => ({ value })),
          setParts: (product.set_parts ?? []).map((value) => ({ value })),
          images,
          inStock: product.in_stock,
          isNew: product.is_new,
          isPreorder: product.is_preorder,
          isActive: true,
        },
      });
    }
    payload.logger.info(`${products.length} products imported`);
  }

  // ---- slides -----------------------------------------------------------
  const slides = read<
    { title: string; subtitle: string; cta: string; url: string; image: string; imageMobile: string | null }[]
  >("content/slides.json");
  const existingSlides = await payload.count({ collection: "slides" });

  if (existingSlides.totalDocs === 0) {
    for (const slide of slides) {
      const image = await uploadImage(slide.image);
      if (!image) continue;
      await payload.create({
        collection: "slides",
        data: {
          title: slide.title.trim() || "Slide",
          subtitle: slide.subtitle.trim() || null,
          ctaLabel: slide.cta,
          ctaUrl: slide.url,
          image,
          imageMobile: slide.imageMobile ? await uploadImage(slide.imageMobile) : null,
          isActive: true,
        },
      });
    }
    payload.logger.info(`${slides.length} slides imported`);
  }

  // ---- home sections ----------------------------------------------------
  const featured = read<{ title: string; url: string }[]>("content/featured.json");
  const existingSections = await payload.count({ collection: "home-sections" });

  if (existingSections.totalDocs === 0) {
    for (const block of featured) {
      const slug = block.url.split("/collections/")[1];
      const category = categoryIds.get(slug);
      if (!category) continue;
      await payload.create({
        collection: "home-sections",
        data: { category, title: block.title, productLimit: 8, isActive: true },
      });
    }
    payload.logger.info(`${featured.length} home sections imported`);
  }

  // ---- pages ------------------------------------------------------------
  const pages = read<Record<string, Record<Locale, { title: string; body: string }>>>("content/pages.json");
  const footerGroups = read<{ footer: { titleKey: string; links: { url: string }[] }[] }>("content/shop.json");

  const groupOf = (slug: string) => {
    const index = footerGroups.footer.findIndex((group) =>
      group.links.some((link) => link.url.endsWith(`/pages/${slug}`)),
    );
    return index === 0 ? "company" : index === 1 ? "help" : undefined;
  };

  const existingPages = await payload.count({ collection: "pages" });
  if (existingPages.totalDocs === 0) {
    for (const [slug, variants] of Object.entries(pages)) {
      const base = variants.az ?? variants.en;
      const created = await payload.create({
        collection: "pages",
        locale: "az",
        data: {
          title: base.title,
          slug,
          body: htmlToLexical(base.body),
          footerGroup: groupOf(slug),
          isActive: true,
        },
      });

      for (const locale of ["en", "ru"] as const) {
        const variant = variants[locale];
        if (!variant) continue;
        await payload.update({
          collection: "pages",
          id: created.id,
          locale,
          data: { title: variant.title, body: htmlToLexical(variant.body) },
        });
      }
    }
    payload.logger.info(`${Object.keys(pages).length} pages imported`);
  }

  // ---- posts ------------------------------------------------------------
  const posts = read<
    Record<
      string,
      Record<Locale, { slug: string; title: string; excerpt: string; body?: string; publishedAtIso: string }>
    >
  >("content/posts.json");

  const existingPosts = await payload.count({ collection: "posts" });
  if (existingPosts.totalDocs === 0) {
    for (const variants of Object.values(posts)) {
      const base = variants.az ?? variants.en;
      const created = await payload.create({
        collection: "posts",
        locale: "az",
        data: {
          title: base.title,
          slug: slugify(base.slug),
          excerpt: base.excerpt,
          body: htmlToLexical(base.body),
          isActive: true,
          publishedAt: new Date(base.publishedAtIso).toISOString(),
        },
      });

      for (const locale of ["en", "ru"] as const) {
        const variant = variants[locale];
        if (!variant) continue;
        await payload.update({
          collection: "posts",
          id: created.id,
          locale,
          data: {
            title: variant.title,
            excerpt: variant.excerpt,
            body: htmlToLexical(variant.body),
          },
        });
      }
    }
    payload.logger.info(`${Object.keys(posts).length} posts imported`);
  }

  payload.logger.info("seed complete");
}
