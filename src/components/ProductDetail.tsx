"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { Product, ProductSibling } from "@/lib/types";
import { notifyWhenInStock } from "@/app/actions/shop";
import { useI18n } from "./I18nProvider";
import { useCart } from "./CartProvider";
import { useShop } from "./ShopProvider";
import Icon from "./Icon";
import PriceTag from "./PriceTag";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";

const MAX_QTY = 20;

const SIZE_GUIDE = [
  { size: "XS/S", chest: "82-88", waist: "62-68", hips: "88-94" },
  { size: "M/L", chest: "90-98", waist: "70-78", hips: "96-104" },
];

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-4 text-left text-xs font-medium tracking-wide2 uppercase"
      >
        {title}
        <Icon
          name="chevron-down"
          size={16}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {/* Hidden rather than unmounted, so the panel stays in the markup as it did. */}
      <div className="pb-5 text-sm leading-relaxed text-ink/70" style={{ display: open ? undefined : "none" }}>
        {children}
      </div>
    </div>
  );
}

export default function ProductDetail({
  product,
  siblings,
  related,
}: {
  product: Product;
  siblings: ProductSibling[];
  related: Product[];
}) {
  const { t, path, locale } = useI18n();
  const cart = useCart();
  const { formatPrice, freeShippingThreshold } = useShop();

  const availabilityOf = (size: string) =>
    product.size_stock[size] ?? { available: product.in_stock, remaining: null };

  // Preselect a size only when exactly one is actually buyable.
  const orderableSizes = product.sizes.filter((size) => availabilityOf(size).available);
  const [size, setSize] = useState<string | null>(
    orderableSizes.length === 1 ? orderableSizes[0] : null,
  );
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySent, setNotifySent] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [notifyPending, startNotify] = useTransition();

  const remaining = size && !product.is_preorder ? availabilityOf(size).remaining : null;
  const lowStock = remaining !== null && remaining > 0 && remaining <= 5 ? remaining : null;

  function addToCart() {
    if (!size) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    cart.add(
      {
        slug: product.slug,
        name: product.name,
        price: product.price,
        compareAt: product.compare_at,
        image: product.images[0] ?? null,
        color: product.color.name,
        size,
        isPreorder: product.is_preorder,
      },
      qty,
    );
  }

  function requestNotify(event: React.FormEvent) {
    event.preventDefault();
    const data = new FormData();
    data.set("email", notifyEmail);
    data.set("slug", product.slug);
    data.set("locale", locale);

    startNotify(async () => {
      const result = await notifyWhenInStock(data);
      if (result.ok) setNotifySent(true);
      else setNotifyError(result.message);
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-[11px] tracking-wide2 text-ink/50 uppercase">
        <Link href={path("/")} className="hover:text-ink">
          {t("product.breadcrumb_home")}
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={path(
            product.category_slug
              ? `/collections/${product.category_slug}`
              : "/collections/all-products",
          )}
          className="hover:text-ink"
        >
          {product.category || t("nav.all_products")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">
          {product.series} {product.item}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden bg-mist">
            {product.images[activeImage] && (
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            )}
            {product.compare_at && (
              <span className="absolute top-4 left-4 bg-ink px-2.5 py-1 text-[10px] font-medium tracking-wide2 text-paper uppercase">
                {t("product.sale")}
              </span>
            )}
            {product.is_preorder && (
              <span className="absolute top-4 right-4 bg-paper px-2.5 py-1 text-[10px] font-medium tracking-wide2 text-ink uppercase">
                {t("product.preorder.badge")}
              </span>
            )}
          </div>

          <div className="mt-3 flex gap-3 overflow-x-auto">
            {product.images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={t("product.image_alt", { number: index + 1 })}
                onClick={() => setActiveImage(index)}
                className={`w-20 shrink-0 border transition-colors ${
                  index === activeImage ? "border-ink" : "border-transparent hover:border-line-strong"
                }`}
              >
                <span className="relative block aspect-[3/4] w-full bg-mist">
                  <Image src={image} alt="" fill sizes="80px" className="object-cover" />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:max-w-lg">
          <h1 className="heading-brand text-xl leading-snug sm:text-2xl">{product.name}</h1>
          <PriceTag price={product.price} compareAt={product.compare_at} size="lg" className="mt-3" />

          <fieldset className="mt-8">
            <legend className="text-xs font-medium tracking-wide2 uppercase">
              {t("product.color")}:{" "}
              <span className="font-normal text-ink/60">{product.color.name}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {siblings.map((sibling) => (
                <Link
                  key={sibling.slug}
                  href={path(`/products/${sibling.slug}`)}
                  title={sibling.color.name}
                  style={{ background: sibling.color.hex }}
                  className={`relative h-9 w-9 rounded-full border transition-transform hover:scale-110 ${
                    sibling.slug === product.slug
                      ? "border-ink ring-1 ring-ink ring-offset-2"
                      : "border-ink/15"
                  }`}
                >
                  <span className="sr-only">{sibling.color.name}</span>
                  {!sibling.in_stock && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center text-ink/40"
                    >
                      <span className="h-px w-full rotate-45 bg-current" />
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <div className="flex items-center justify-between">
              <legend className="text-xs font-medium tracking-wide2 uppercase">
                {t("product.size")}
              </legend>
              {product.sizes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="text-[11px] text-ink/50 underline underline-offset-4 hover:text-ink"
                >
                  {t("product.size_guide")}
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((option) => {
                const available = availabilityOf(option).available;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={!available}
                    aria-pressed={size === option}
                    title={available ? undefined : t("product.size_unavailable")}
                    onClick={() => {
                      setSize(option);
                      setSizeError(false);
                    }}
                    className={`border px-6 py-2.5 text-xs transition-colors ${
                      size === option
                        ? "border-ink bg-ink text-paper"
                        : "border-line-strong hover:border-ink"
                    } ${
                      available
                        ? ""
                        : "cursor-not-allowed text-ink/30 line-through hover:border-line-strong"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {sizeError ? (
              <p className="mt-2 text-xs text-sale">{t("product.size_required")}</p>
            ) : (
              lowStock && (
                <p className="mt-2 text-xs text-sale">{t("product.low_stock", { count: lowStock })}</p>
              )
            )}
          </fieldset>

          {product.set_parts && product.set_parts.length > 0 && (
            <div className="mt-7 bg-mist/70 px-4 py-3.5">
              <p className="text-xs font-medium tracking-wide2 uppercase">
                {t("product.set_includes")}
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink/70">
                {product.set_parts.map((part) => (
                  <li key={part} className="flex items-center gap-1.5">
                    <Icon name="check" size={13} /> {part}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.in_stock ? (
            <div>
              {product.is_preorder && (
                <div className="mt-8 border border-line bg-mist/70 px-4 py-3.5 text-xs leading-relaxed">
                  <p className="font-medium tracking-wide2 uppercase">{t("product.preorder.badge")}</p>
                  <p className="mt-1.5 text-ink/70">
                    {product.preorder_ships_at
                      ? t("product.preorder.ships_at", { date: product.preorder_ships_at })
                      : t("product.preorder.no_date")}
                  </p>
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <div className="flex shrink-0 items-center border border-line-strong">
                  <button
                    type="button"
                    className="px-3.5 py-3"
                    aria-label={t("product.qty_decrease")}
                    onClick={() => setQty((value) => Math.max(1, value - 1))}
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <span className="w-8 text-center text-sm">{qty}</span>
                  <button
                    type="button"
                    className="px-3.5 py-3"
                    aria-label={t("product.qty_increase")}
                    onClick={() => setQty((value) => Math.min(MAX_QTY, value + 1))}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
                <button type="button" className="btn-primary flex-1" onClick={addToCart}>
                  {product.is_preorder ? t("product.preorder.cta") : t("product.add_to_cart")}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              {notifySent ? (
                <p className="flex items-center justify-center gap-2 border border-line py-3.5 text-xs tracking-wide2 uppercase">
                  <Icon name="check" size={15} /> {t("product.notify_sent")}
                </p>
              ) : (
                <form onSubmit={requestNotify} className="space-y-3">
                  <p className="text-xs tracking-wide2 text-ink/60 uppercase">
                    {t("product.out_of_stock_note")}
                  </p>
                  <div className="flex">
                    <input
                      type="email"
                      required
                      value={notifyEmail}
                      onChange={(event) => setNotifyEmail(event.target.value)}
                      placeholder={t("product.email_placeholder")}
                      className="input-brand flex-1"
                    />
                    <button
                      type="submit"
                      disabled={notifyPending}
                      className="btn-secondary shrink-0 border-l-0"
                    >
                      {t("product.notify_cta")}
                    </button>
                  </div>
                  {notifyError && <p className="text-xs text-sale">{notifyError}</p>}
                </form>
              )}
            </div>
          )}

          <div className="mt-9">
            <p className="text-sm leading-relaxed text-ink/70">{product.description}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-ink/70">
              {product.features.map((feature) => (
                <li key={feature} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 bg-ink/50" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-9 border-t border-line">
            <Accordion title={t("product.care.title")}>{t("product.care.body")}</Accordion>
            <Accordion title={t("product.shipping.title")}>
              {t("product.shipping.body", { threshold: formatPrice(freeShippingThreshold) })}
            </Accordion>
            <Accordion title={t("product.returns.title")}>{t("product.returns.body")}</Accordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 sm:mt-24">
          <SectionHeading title={t("product.related_heading")} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}

      {guideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setGuideOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("product.size_guide.title")}
            className="w-full max-w-md bg-paper p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="heading-brand text-sm">{t("product.size_guide.title")}</h2>
              <button
                type="button"
                className="-m-2 p-2"
                aria-label={t("general.close")}
                onClick={() => setGuideOpen(false)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-ink text-left text-xs tracking-wide2 uppercase">
                  <th className="py-2 font-medium">{t("product.size_guide.size")}</th>
                  <th className="py-2 font-medium">{t("product.size_guide.chest")}</th>
                  <th className="py-2 font-medium">{t("product.size_guide.waist")}</th>
                  <th className="py-2 font-medium">{t("product.size_guide.hips")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink/70">
                {SIZE_GUIDE.map((row) => (
                  <tr key={row.size}>
                    <td className="py-2.5">{row.size}</td>
                    <td>{row.chest}</td>
                    <td>{row.waist}</td>
                    <td>{row.hips}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-4 text-xs text-ink/50">{t("product.size_guide.note")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
