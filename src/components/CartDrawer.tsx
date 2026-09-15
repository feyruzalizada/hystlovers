"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useI18n } from "./I18nProvider";
import { useShop } from "./ShopProvider";

export default function CartDrawer() {
  const cart = useCart();
  const { t, path } = useI18n();
  const { formatPrice } = useShop();

  if (!cart.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label={t("general.close")}
        className="flex-1 bg-ink/30"
        onClick={cart.close}
      />
      <aside className="flex h-full w-full max-w-md flex-col bg-paper">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="heading-brand text-sm">{t("cart.title")}</h2>
          <button type="button" className="btn-ghost" onClick={cart.close}>
            {t("general.close")}
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="text-sm text-ink-soft">{t("cart.empty")}</p>
            <Link href={path("/collections/all-products")} className="btn-secondary" onClick={cart.close}>
              {t("cart.start_shopping")}
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-3 text-xs tracking-brand text-ink-soft uppercase">
              {cart.freeShippingRemaining > 0
                ? t("cart.free_shipping_progress", { amount: formatPrice(cart.freeShippingRemaining) })
                : t("cart.free_shipping_reached")}
            </div>

            <ul className="flex-1 overflow-y-auto">
              {cart.lines.map((line) => (
                <li key={`${line.slug}-${line.size}`} className="flex gap-4 border-b border-line p-5">
                  <div className="relative h-28 w-20 shrink-0 bg-mist">
                    {line.image && (
                      <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Link
                      href={path(`/products/${line.slug}`)}
                      onClick={cart.close}
                      className="text-xs tracking-brand uppercase"
                    >
                      {line.name}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {line.color} · {line.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          className="px-3 py-1"
                          aria-label={t("product.qty_decrease")}
                          onClick={() => cart.setQty(line.slug, line.size, line.qty - 1)}
                        >
                          −
                        </button>
                        <span className="px-3 text-sm">{line.qty}</span>
                        <button
                          type="button"
                          className="px-3 py-1"
                          aria-label={t("product.qty_increase")}
                          onClick={() => cart.setQty(line.slug, line.size, line.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm">{formatPrice(line.price * line.qty)}</span>
                    </div>
                    <button
                      type="button"
                      className="self-start text-[11px] tracking-brand text-ink-soft uppercase underline underline-offset-4"
                      onClick={() => cart.remove(line.slug, line.size)}
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="tracking-brand uppercase">{t("cart.subtotal")}</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-ink-soft">{t("cart.shipping_note")}</p>
              <Link
                href={path("/checkout")}
                onClick={cart.close}
                className="btn-primary mt-5 w-full"
              >
                {t("cart.checkout")}
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
