"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useI18n } from "./I18nProvider";
import { useShop } from "./ShopProvider";
import DrawerShell from "./DrawerShell";
import Icon from "./Icon";

export default function CartDrawer() {
  const cart = useCart();
  const { t, path } = useI18n();
  const { formatPrice, freeShippingThreshold } = useShop();

  const footer =
    cart.lines.length > 0 ? (
      <div className="space-y-4 border-t border-line p-5">
        <p className="bg-mist px-4 py-3 text-center text-xs">
          {cart.subtotal < freeShippingThreshold
            ? t("cart.free_shipping_progress", {
                amount: formatPrice(freeShippingThreshold - cart.subtotal),
              })
            : t("cart.free_shipping_reached")}
        </p>

        <div className="flex items-center justify-between text-sm">
          <span className="tracking-wide2 uppercase">{t("cart.subtotal")}</span>
          <span className="font-medium">{formatPrice(cart.subtotal)}</span>
        </div>

        <p className="text-[11px] text-ink/50">{t("cart.shipping_note")}</p>

        <Link href={path("/checkout")} onClick={cart.close} className="btn-primary w-full">
          {t("cart.checkout")}
        </Link>
      </div>
    ) : undefined;

  return (
    <DrawerShell open={cart.isOpen} title={t("cart.title")} onClose={cart.close} footer={footer}>
      {cart.lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
          <Icon name="bag" size={40} className="opacity-20" />
          <p className="text-sm text-ink/60">{t("cart.empty")}</p>
          <Link href={path("/collections/all-products")} onClick={cart.close} className="btn-secondary w-full">
            {t("cart.start_shopping")}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {cart.lines.map((line) => (
            <li key={`${line.slug}-${line.size}`} className="flex gap-4 p-5">
              <Link
                href={path(`/products/${line.slug}`)}
                onClick={cart.close}
                className="relative aspect-[3/4] w-20 shrink-0 bg-mist"
              >
                {line.image && (
                  <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs tracking-wide2 uppercase">{line.name}</h3>
                    <p className="mt-1 text-xs text-ink/50">
                      {line.color} · {line.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="-m-1.5 p-1.5 opacity-40 transition-opacity hover:opacity-100"
                    aria-label={t("cart.remove")}
                    onClick={() => cart.remove(line.slug, line.size)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      className="px-2.5 py-1.5"
                      aria-label={t("product.qty_decrease")}
                      onClick={() => cart.setQty(line.slug, line.size, line.qty - 1)}
                    >
                      <Icon name="minus" size={14} />
                    </button>
                    <span className="w-7 text-center text-xs">{line.qty}</span>
                    <button
                      type="button"
                      className="px-2.5 py-1.5"
                      aria-label={t("product.qty_increase")}
                      onClick={() => cart.setQty(line.slug, line.size, line.qty + 1)}
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(line.price * line.qty)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DrawerShell>
  );
}
