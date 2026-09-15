"use client";

import Link from "next/link";
import { useTransition } from "react";
import { logout } from "@/app/actions/auth";
import type { OrderView } from "@/lib/orders";
import { useI18n } from "./I18nProvider";
import { useShop } from "./ShopProvider";

export function LogoutButton() {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const data = new FormData();
          data.set("locale", locale);
          await logout(data);
        })
      }
    >
      {t("account.logout")}
    </button>
  );
}

export function OrderList({ orders }: { orders: OrderView[] }) {
  const { t, path } = useI18n();
  const { formatPrice } = useShop();

  if (orders.length === 0) {
    return <p className="py-16 text-center text-sm text-ink-soft">{t("account.no_orders")}</p>;
  }

  return (
    <ul className="mt-6 flex flex-col">
      {orders.map((order) => (
        <li key={order.number} className="border-b border-line py-5">
          <Link
            href={path(`/account/orders/${order.number}`)}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs tracking-brand uppercase">{order.number}</p>
              <p className="mt-1 text-xs text-ink-soft">
                {order.createdAt} · {t("account.items_count", { count: order.items.length })}
              </p>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-xs tracking-brand text-ink-soft uppercase">
                {t(order.statusKey)}
              </span>
              <span className="text-sm">{formatPrice(order.total)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OrderDetail({
  order,
  bankDetails,
  justPlaced,
}: {
  order: OrderView;
  bankDetails: string | null;
  justPlaced?: boolean;
}) {
  const { t, path } = useI18n();
  const { formatPrice } = useShop();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-16 md:px-8">
      <Link href={path("/account")} className="btn-ghost">
        {t("account.order.back")}
      </Link>

      {justPlaced && (
        <p className="mt-8 border border-line bg-mist p-4 text-sm">{t("account.order.placed_flash")}</p>
      )}

      <header className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="heading-brand text-lg">{order.number}</h1>
        <div className="flex gap-4 text-xs tracking-brand text-ink-soft uppercase">
          <span>{order.createdAt}</span>
          <span>{t(order.statusKey)}</span>
          <span>{t(order.paymentStatusKey)}</span>
        </div>
      </header>

      <ul className="mt-10 border-t border-line">
        {order.items.map((item, index) => (
          <li key={`${item.name}-${item.size}-${index}`} className="flex justify-between gap-4 border-b border-line py-4">
            <div>
              {item.slug ? (
                <Link href={path(`/products/${item.slug}`)} className="text-xs tracking-brand uppercase">
                  {item.name}
                </Link>
              ) : (
                <span className="text-xs tracking-brand uppercase">{item.name}</span>
              )}
              <p className="mt-1 text-xs text-ink-soft">
                {item.color} · {item.size} · {t("checkout.qty_suffix", { count: item.qty })}
                {item.isPreorder ? ` · ${t("product.preorder.badge")}` : ""}
              </p>
            </div>
            <span className="text-sm whitespace-nowrap">{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 ml-auto flex max-w-xs flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">{t("checkout.subtotal")}</dt>
          <dd>{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">{t("checkout.shipping")}</dt>
          <dd>{order.shippingTotal === 0 ? t("checkout.shipping_free") : formatPrice(order.shippingTotal)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-base">
          <dt className="tracking-brand uppercase">{t("checkout.total")}</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
      </dl>

      <section className="mt-12 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="heading-brand text-xs">{t("account.order.delivery_heading")}</h2>
          <p className="mt-3 text-sm text-ink-soft">
            {order.customerName}
            <br />
            {order.phone}
            <br />
            {order.city}
            <br />
            {order.address}
          </p>
          {order.note && (
            <p className="mt-3 text-sm text-ink-soft">
              {t("account.order.note_prefix")} {order.note}
            </p>
          )}
        </div>

        {order.paymentMethod === "bank_transfer" && bankDetails && (
          <div>
            <h2 className="heading-brand text-xs">{t("account.order.bank_title")}</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{bankDetails}</p>
            <p className="mt-3 text-xs text-ink-soft">
              {t("account.order.bank_reference", { number: order.number })}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
