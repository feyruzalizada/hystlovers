"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrder } from "@/app/actions/checkout";
import { useCart } from "./CartProvider";
import { useI18n } from "./I18nProvider";
import { useShop } from "./ShopProvider";

const PAYMENT_METHODS = ["cod", "bank_transfer"] as const;

export default function CheckoutForm({ defaultName }: { defaultName: string }) {
  const { t, path, locale } = useI18n();
  const { formatPrice, freeShippingThreshold, shippingFee } = useShop();
  const cart = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const shipping = cart.subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = cart.subtotal + shipping;

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-24 text-center md:px-8">
        <h1 className="heading-brand text-lg">{t("checkout.title")}</h1>
        <p className="mt-4 text-sm text-ink-soft">{t("checkout.empty")}</p>
        <Link href={path("/collections/all-products")} className="btn-secondary mt-8">
          {t("cart.start_shopping")}
        </Link>
      </div>
    );
  }

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
        paymentMethod: String(form.get("payment_method") ?? "cod"),
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
    <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8">
      <h1 className="heading-brand text-lg">{t("checkout.title")}</h1>

      <form onSubmit={onSubmit} className="mt-10 grid gap-12 md:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-brand uppercase">{t("checkout.name")}</span>
            <input name="customer_name" required defaultValue={defaultName} className="input-brand" />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-brand uppercase">{t("checkout.phone")}</span>
            <input name="phone" required inputMode="tel" className="input-brand" />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-brand uppercase">{t("checkout.city")}</span>
            <input name="city" required className="input-brand" />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-brand uppercase">{t("checkout.address")}</span>
            <textarea name="address" required rows={3} className="input-brand" />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-brand uppercase">{t("checkout.note")}</span>
            <textarea name="note" rows={2} maxLength={1000} className="input-brand" />
          </label>

          <fieldset className="mt-2">
            <legend className="text-xs tracking-brand uppercase">{t("checkout.payment_method")}</legend>
            <div className="mt-3 flex flex-col gap-3">
              {PAYMENT_METHODS.map((method, index) => (
                <label key={method} className="flex items-center gap-3 border border-line p-4 text-sm">
                  <input
                    type="radio"
                    name="payment_method"
                    value={method}
                    defaultChecked={index === 0}
                  />
                  {t(`checkout.payment.${method}`)}
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-soft">{t("checkout.bank_note")}</p>
          </fieldset>
        </div>

        <aside className="h-fit border border-line p-6">
          <h2 className="heading-brand text-xs">{t("checkout.summary")}</h2>

          <ul className="mt-5 flex flex-col gap-4">
            {cart.lines.map((line) => (
              <li key={`${line.slug}-${line.size}`} className="flex justify-between gap-3 text-sm">
                <span>
                  {line.name}
                  <span className="block text-xs text-ink-soft">
                    {line.color} · {line.size} · {t("checkout.qty_suffix", { count: line.qty })}
                  </span>
                </span>
                <span className="whitespace-nowrap">{formatPrice(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-col gap-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t("checkout.subtotal")}</dt>
              <dd>{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t("checkout.shipping")}</dt>
              <dd>{shipping === 0 ? t("checkout.shipping_free") : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="tracking-brand uppercase">{t("checkout.total")}</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          {error && <p className="mt-5 text-xs text-sale">{error}</p>}

          <button type="submit" className="btn-primary mt-6 w-full" disabled={pending}>
            {pending ? t("checkout.submitting") : t("checkout.submit", { total: formatPrice(total) })}
          </button>
        </aside>
      </form>
    </div>
  );
}
