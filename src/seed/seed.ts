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
  const media = new Map<string, number | string>();

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
    });

    media.set(publicPath, created.id);
    return created.id;
  };

  // ---- admin user -------------------------------------------------------
  const email = process.env.ADMIN_EMAIL ?? "admin@hystlovers.com";
  const existingUsers = await payload.count({ collection: "users" });
  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: "users",
      data: {
        email,
        password: process.env.ADMIN_PASSWORD ?? "hystlovers123",
        name: "Administrator",
      },
    });
    payload.logger.info(`admin user created: ${email}`);
  }

  // ---- site texts -------------------------------------------------------
  const messages = Object.fromEntries(
    LOCALES.map((locale) => [locale, read<Record<string, string>>(`messages/${locale}.json`)]),
  ) as Record<Locale, Record<string, string>>;

  const existingTexts = await payload.count({ collection: "site-texts" });
  if (existingTexts.totalDocs === 0) {
    for (const key of Object.keys(messages.az)) {
      await payload.create({
        collection: "site-texts",
        data: {
          key,
          group: key.split(".")[0],
          az: messages.az[key],
          en: messages.en[key] ?? null,
          ru: messages.ru[key] ?? null,
        },
      });
    }
    payload.logger.info(`${Object.keys(messages.az).length} site texts imported`);
  }


  // Strings the rewrite introduced that the PHP shop had no key for.
  const EXTRA_TEXTS: Record<string, [string, string, string]> = {
    "form.error.invalid": [
      "Zəhmət olmasa formu düzgün doldurun.",
      "Please check the form and try again.",
      "Пожалуйста, проверьте форму и попробуйте снова.",
    ],
    "form.error.unexpected": [
      "Gözlənilməz xəta baş verdi. Bir az sonra yenidən cəhd edin.",
      "Something went wrong. Please try again in a moment.",
      "Произошла ошибка. Попробуйте ещё раз чуть позже.",
    ],
  };

  for (const [key, [az, en, ru]] of Object.entries(EXTRA_TEXTS)) {
    const found = await payload.find({
      collection: "site-texts",
      where: { key: { equals: key } },
      limit: 1,
    });
    if (found.totalDocs === 0) {
      await payload.create({
        collection: "site-texts",
        data: { key, group: key.split(".")[0], az, en, ru },
      });
    }
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

  await payload.updateGlobal({
    slug: "settings",
    data: {
      shopName: "Hystlovers",
      currencyCode: shop.currency.code,
      currencySymbol: shop.currency.symbol,
      freeShippingThreshold: shop.freeShippingThreshold,
      shippingFee: shop.shippingFee,
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

  // ---- categories -------------------------------------------------------
  const categorySeed = read<{ slug: string; name: string | null; parent: string | null }[]>(
    "content/categories.json",
  ).filter((c) => c.name); // new-in / all-products are virtual collections, not rows

  const categoryIds = new Map<string, number | string>();
  const existingCategories = await payload.count({ collection: "categories" });

  if (existingCategories.totalDocs === 0) {
    let order = 0;
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
            sortOrder: ++order,
          },
        });
        categoryIds.set(category.slug, created.id);
      }
    }
    payload.logger.info(`${categoryIds.size} categories imported`);
  } else {
    const all = await payload.find({ collection: "categories", limit: 100, pagination: false });
    all.docs.forEach((doc) => categoryIds.set(doc.slug as string, doc.id));
  }

  // ---- products ---------------------------------------------------------
  const products = read<SeedProduct[]>("content/products.json");
  const existingProducts = await payload.count({ collection: "products" });

  if (existingProducts.totalDocs === 0) {
    let order = 0;
    for (const product of products) {
      const images: { image: number | string }[] = [];
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
          sortOrder: ++order,
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
    let order = 0;
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
          sortOrder: ++order,
        },
      });
    }
    payload.logger.info(`${slides.length} slides imported`);
  }

  // ---- home sections ----------------------------------------------------
  const featured = read<{ title: string; url: string }[]>("content/featured.json");
  const existingSections = await payload.count({ collection: "home-sections" });

  if (existingSections.totalDocs === 0) {
    let order = 0;
    for (const block of featured) {
      const slug = block.url.split("/collections/")[1];
      const category = categoryIds.get(slug);
      if (!category) continue;
      await payload.create({
        collection: "home-sections",
        data: { category, title: block.title, productLimit: 8, isActive: true, sortOrder: ++order },
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
    let order = 0;
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
          sortOrder: ++order,
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
