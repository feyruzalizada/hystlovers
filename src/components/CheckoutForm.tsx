"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrder } from "@/app/actions/checkout";
import { useCart } from "./CartProvider";
import { useI18n } from "./I18nProvider";
import { useShop } from "./ShopProvider";

const PAYMENT_METHODS = ["cod", "bank_transfer"] as const;

const LABEL = "mb-2 block text-xs font-medium tracking-wide2 uppercase";

export default function CheckoutForm({ defaultName }: { defaultName: string }) {
  const { t, path, locale } = useI18n();
  const { formatPrice, freeShippingThreshold, shippingFee } = useShop();
  const cart = useCart();
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("cod");

  const shipping = cart.subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = cart.subtotal + shipping;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      setError(null);
      const result = await placeOrder({
        locale,
        customerName: String(form.get("customer_name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        city: String(form.get("city") ?? ""),
        address: String(form.get("address") ?? ""),
        note: String(form.get("note") ?? ""),
        paymentMethod: method,
        items: cart.lines.map((line) => ({ slug: line.slug, size: line.size, qty: line.qty })),
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      cart.clear();
      router.push(path(`/account/orders/${result.number}?placed=1`));
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="heading-brand text-2xl">{t("checkout.title")}</h1>

      {cart.lines.length === 0 ? (
        <div className="mt-12 max-w-md">
          <p className="text-sm text-ink/60">{t("checkout.empty")}</p>
          <Link href={path("/collections/all-products")} className="btn-secondary mt-6 inline-block">
            {t("cart.start_shopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_24rem]">
          <form onSubmit={onSubmit} className="space-y-5">
            {error && <p className="bg-sale/10 px-4 py-3 text-xs text-sale">{error}</p>}

            <label className="block">
              <span className={LABEL}>{t("checkout.name")}</span>
              <input
                name="customer_name"
                type="text"
                required
                autoComplete="name"
                defaultValue={defaultName}
                className="input-brand"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>{t("checkout.phone")}</span>
                <input
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+994 50 000 00 00"
                  className="input-brand"
                />
              </label>
              <label className="block">
                <span className={LABEL}>{t("checkout.city")}</span>
                <input
                  name="city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  placeholder="Bakı"
                  className="input-brand"
                />
              </label>
            </div>

            <label className="block">
              <span className={LABEL}>{t("checkout.address")}</span>
              <textarea
                name="address"
                required
                rows={3}
                autoComplete="street-address"
                className="input-brand"
              />
            </label>

            <label className="block">
              <span className={LABEL}>{t("checkout.note")}</span>
              <textarea name="note" rows={2} maxLength={1000} className="input-brand" />
            </label>

            <fieldset>
              <legend className="mb-3 text-xs font-medium tracking-wide2 uppercase">
                {t("checkout.payment_method")}
              </legend>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((value) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm ${
                      method === value ? "border-ink" : "border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={value}
                      checked={method === value}
                      onChange={() => setMethod(value)}
                      className="accent-ink"
                    />
                    {t(`checkout.payment.${value}`)}
                  </label>
                ))}
              </div>
              {method === "bank_transfer" && (
                <p className="mt-3 bg-mist px-4 py-3 text-xs text-ink/70">{t("checkout.bank_note")}</p>
              )}
            </fieldset>

            <button type="submit" className="btn-primary w-full" disabled={pending}>
              {pending
                ? t("checkout.submitting")
                : t("checkout.submit", { total: formatPrice(total) })}
            </button>
          </form>

          <aside className="h-fit border border-line p-6 lg:sticky lg:top-32">
            <h2 className="text-xs font-medium tracking-wide2 uppercase">{t("checkout.summary")}</h2>

            <ul className="mt-4 divide-y divide-line">
              {cart.lines.map((line) => (
                <li key={`${line.slug}-${line.size}`} className="flex gap-4 py-4">
                  <span className="relative aspect-[3/4] w-14 shrink-0 bg-mist">
                    {line.image && (
                      <Image src={line.image} alt={line.name} fill sizes="56px" className="object-cover" />
                    )}
                  </span>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-xs tracking-wide2 uppercase">{line.name}</p>
                    <p className="mt-1 text-xs text-ink/50">
                      {line.color} · {line.size} · {line.qty} {t("checkout.qty_suffix")}
                    </p>
                    {line.isPreorder && (
                      <p className="mt-1 inline-block bg-ink px-1.5 py-0.5 text-[10px] tracking-wide2 text-paper uppercase">
                        {t("product.preorder.badge")}
                      </p>
                    )}
                  </div>
                  <p className="self-center text-sm">{formatPrice(line.price * line.qty)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/60">{t("checkout.subtotal")}</dt>
                <dd>{formatPrice(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/60">{t("checkout.shipping")}</dt>
                <dd>{shipping === 0 ? t("checkout.shipping_free") : formatPrice(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-medium">
                <dt className="tracking-wide2 uppercase">{t("checkout.total")}</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            {cart.lines.some((line) => line.isPreorder) && (
              <p className="mt-4 bg-mist px-4 py-3 text-[11px] leading-relaxed text-ink/70">
                {t("product.preorder.note")}
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
