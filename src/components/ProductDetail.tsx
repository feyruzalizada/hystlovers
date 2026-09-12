"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product, ProductSibling } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useI18n } from "./I18nProvider";
import { useCart } from "./CartProvider";
import shop from "@/data/shop.json";

const sizeGuide = [
  { size: "XS/S", chest: "82—90", waist: "62—70", hips: "88—96" },
  { size: "M/L", chest: "90—100", waist: "70—80", hips: "96—106" },
];

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-xs tracking-brand uppercase"
      >
        {title}
        <span className="text-lg leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-5 text-sm leading-relaxed text-ink-soft">{children}</div>}
    </div>
  );
}

export default function ProductDetail({
  product,
  siblings,
}: {
  product: Product;
  siblings: ProductSibling[];
}) {
  const { t, path } = useI18n();
  const cart = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notified, setNotified] = useState(false);

  const onSale = product.compare_at != null && product.compare_at > product.price;
  const stock = size ? product.size_stock[size] : null;
  const lowStock = stock?.remaining != null && stock.remaining <= 3 ? stock.remaining : null;

  function addToCart() {
    if (!size) {
      setError(t("product.size_required"));
      return;
    }
    if (!product.size_stock[size]?.available && !product.is_preorder) {
      setError(t("product.size_unavailable"));
      return;
    }
    setError(null);
    cart.add(
      {
        slug: product.slug,
        name: product.name,
        price: product.price,
        compareAt: product.compare_at,
        image: product.images[0] ?? null,
        color: product.color.name,
        size,
      },
      qty,
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
      <nav className="mb-8 text-xs tracking-brand text-ink-soft uppercase">
        <Link href={path("/")}>{t("product.breadcrumb_home")}</Link>
        <span className="px-2">/</span>
        <Link href={path(`/collections/${product.category_slug}`)}>{product.category}</Link>
        <span className="px-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="grid gap-3 sm:grid-cols-2">
          {product.images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className={`relative aspect-[3/4] bg-mist ${
                product.images.length === 1 ? "sm:col-span-2" : ""
              }`}
            >
              <Image
                src={image}
                alt={t("product.image_alt", { number: index + 1 })}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="text-xs tracking-brand text-ink-soft uppercase">{product.series}</p>
          <h1 className="heading-brand mt-2 text-xl">{product.name}</h1>

          <p className="mt-4 text-lg">
            {onSale && (
              <span className="mr-3 text-ink-soft line-through">
                {formatPrice(product.compare_at!)}
              </span>
            )}
            <span className={onSale ? "text-sale" : undefined}>{formatPrice(product.price)}</span>
          </p>

          {product.is_preorder && (
            <p className="mt-3 text-xs tracking-brand text-ink-soft uppercase">
              {product.preorder_ships_at
                ? t("product.preorder.ships_at", { date: product.preorder_ships_at })
                : t("product.preorder.no_date")}
            </p>
          )}

          {siblings.length > 1 && (
            <div className="mt-8">
              <p className="text-xs tracking-brand uppercase">
                {t("product.color")}: {product.color.name}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {siblings.map((sibling) => (
                  <Link
                    key={sibling.slug}
                    href={path(`/products/${sibling.slug}`)}
                    aria-label={sibling.color.name}
                    className={`relative h-8 w-8 border ${
                      sibling.slug === product.slug ? "border-ink" : "border-line"
                    } ${sibling.in_stock ? "" : "opacity-40"}`}
                    style={{ backgroundColor: sibling.color.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-brand uppercase">{t("product.size")}</p>
              <button type="button" className="btn-ghost" onClick={() => setGuideOpen(true)}>
                {t("product.size_guide")}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.sizes.map((option) => {
                const available = product.size_stock[option]?.available || product.is_preorder;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSize(option);
                      setError(null);
                    }}
                    className={`border px-5 py-3 text-xs tracking-brand uppercase ${
                      size === option ? "border-ink bg-ink text-paper" : "border-line"
                    } ${available ? "" : "text-ink-soft line-through"}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {lowStock && (
              <p className="mt-3 text-xs text-sale">{t("product.low_stock", { count: lowStock })}</p>
            )}
          </div>

          {product.set_parts && product.set_parts.length > 0 && (
            <div className="mt-8">
              <p className="text-xs tracking-brand uppercase">{t("product.set_includes")}</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
                {product.set_parts.map((part) => (
                  <li key={part}>{part}</li>
                ))}
              </ul>
            </div>
          )}

          {product.in_stock || product.is_preorder ? (
            <div className="mt-8 flex items-stretch gap-3">
              <div className="flex items-center border border-line">
                <button
                  type="button"
                  aria-label={t("product.qty_decrease")}
                  className="px-4"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="px-3 text-sm">{qty}</span>
                <button
                  type="button"
                  aria-label={t("product.qty_increase")}
                  className="px-4"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </button>
              </div>
              <button type="button" onClick={addToCart} className="btn-primary flex-1">
                {product.is_preorder ? t("product.preorder.cta") : t("product.add_to_cart")}
              </button>
            </div>
          ) : (
            <div className="mt-8 border border-line p-5">
              <p className="text-sm text-ink-soft">{t("product.out_of_stock_note")}</p>
              {notified ? (
                <p className="mt-3 text-xs tracking-brand uppercase">{t("product.notify_sent")}</p>
              ) : (
                <form
                  className="mt-3 flex gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setNotified(true);
                  }}
                >
                  <input
                    type="email"
                    required
                    value={notifyEmail}
                    onChange={(event) => setNotifyEmail(event.target.value)}
                    placeholder={t("product.email_placeholder")}
                    className="input-brand"
                  />
                  <button type="submit" className="btn-secondary whitespace-nowrap">
                    {t("product.notify_cta")}
                  </button>
                </form>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-xs text-sale">{error}</p>}
          {product.is_preorder && (
            <p className="mt-3 text-xs text-ink-soft">{t("product.preorder.note")}</p>
          )}

          <div className="mt-10">
            <p className="text-sm leading-relaxed text-ink-soft">{product.description}</p>
            {product.features.length > 0 && (
              <ul className="mt-5 list-disc pl-5 text-sm text-ink-soft">
                {product.features.map((feature) => (
                  <li key={feature} className="mb-1">
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-10">
            <Accordion title={t("product.care.title")}>{t("product.care.body")}</Accordion>
            <Accordion title={t("product.shipping.title")}>
              {t("product.shipping.body", {
                threshold: `${shop.freeShippingThreshold} ${shop.currency.symbol}`,
              })}
            </Accordion>
            <Accordion title={t("product.returns.title")}>{t("product.returns.body")}</Accordion>
          </div>
        </div>
      </div>

      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-lg bg-paper p-6">
            <div className="flex items-center justify-between">
              <h2 className="heading-brand text-sm">{t("product.size_guide.title")}</h2>
              <button type="button" className="btn-ghost" onClick={() => setGuideOpen(false)}>
                {t("general.close")}
              </button>
            </div>
            <table className="mt-5 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs tracking-brand uppercase">
                  <th className="py-2">{t("product.size_guide.size")}</th>
                  <th className="py-2">{t("product.size_guide.chest")}</th>
                  <th className="py-2">{t("product.size_guide.waist")}</th>
                  <th className="py-2">{t("product.size_guide.hips")}</th>
                </tr>
              </thead>
              <tbody>
                {sizeGuide.map((row) => (
                  <tr key={row.size} className="border-b border-line">
                    <td className="py-2">{row.size}</td>
                    <td className="py-2">{row.chest}</td>
                    <td className="py-2">{row.waist}</td>
                    <td className="py-2">{row.hips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-ink-soft">{t("product.size_guide.note")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
