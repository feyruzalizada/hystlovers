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
      className="btn-ghost text-xs"
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
    return (
      <p className="mt-6 text-sm text-ink/60">
        {t("account.no_orders")}{" "}
        <Link
          href={path("/collections/all-products")}
          className="text-ink underline underline-offset-4"
        >
          {t("cart.start_shopping")}
        </Link>
      </p>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-line border-t border-b border-line">
      {orders.map((order) => (
        <li key={order.number}>
          <Link
            href={path(`/account/orders/${order.number}`)}
            className="flex flex-wrap items-center justify-between gap-3 py-5 transition-opacity hover:opacity-60"
          >
            <div>
              <p className="text-sm font-medium">{order.number}</p>
              <p className="mt-1 text-xs text-ink/50">
                {order.createdAt} · {t("account.items_count", { count: order.items.length })}
              </p>
            </div>
            <div className="flex items-center gap-6">
              {order.hasPreorder && (
                <span className="bg-ink px-2 py-1 text-[10px] tracking-brand text-paper uppercase">
                  {t("product.preorder.badge")}
                </span>
              )}
              <span className="bg-mist px-3 py-1 text-[11px] tracking-brand uppercase">
                {t(order.statusKey)}
              </span>
              <span className="text-sm font-medium">{formatPrice(order.total)}</span>
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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {justPlaced && (
        <p className="mb-8 bg-mist px-5 py-4 text-sm">{t("account.order.placed_flash")}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="heading-brand text-2xl">{order.number}</h1>
        <div className="flex items-center gap-2">
          <span className="bg-mist px-3 py-1 text-[11px] tracking-brand uppercase">
            {t(order.statusKey)}
          </span>
          <span className="bg-mist px-3 py-1 text-[11px] tracking-brand uppercase">
            {t(order.paymentStatusKey)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink/50">{order.createdAt}</p>

      {order.hasPreorder && (
        <p className="mt-6 border border-line bg-mist/60 px-5 py-4 text-sm">
          {t("product.preorder.note")}
        </p>
      )}

      {bankDetails && (
        <div className="mt-8 border border-line bg-mist/60 p-5 text-sm">
          <h2 className="text-xs font-medium tracking-brand uppercase">
            {t("account.order.bank_title")}
          </h2>
          <p className="mt-3 whitespace-pre-line">{bankDetails}</p>
          <p className="mt-3 text-xs text-ink/60">
            {t("account.order.bank_reference", { number: order.number })}
          </p>
        </div>
      )}

      <ul className="mt-10 divide-y divide-line border-t border-b border-line">
        {order.items.map((item, index) => (
          <li
            key={`${item.name}-${item.size}-${index}`}
            className="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div>
              {item.slug ? (
                <Link
                  href={path(`/products/${item.slug}`)}
                  className="text-xs tracking-brand uppercase underline-offset-4 hover:underline"
                >
                  {item.name}
                </Link>
              ) : (
                <p className="text-xs tracking-brand uppercase">{item.name}</p>
              )}
              {item.isPreorder && (
                <span className="ml-2 bg-ink px-1.5 py-0.5 text-[10px] tracking-brand text-paper uppercase">
                  {t("product.preorder.badge")}
                </span>
              )}
              <p className="mt-1 text-xs text-ink/50">
                {item.color} · {item.size} · {item.qty} {t("checkout.qty_suffix")}
              </p>
            </div>
            <p className="text-sm">{formatPrice(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 ml-auto flex max-w-xs flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink/60">{t("checkout.subtotal")}</dt>
          <dd>{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/60">{t("checkout.shipping")}</dt>
          <dd>
            {order.shippingTotal === 0
              ? t("checkout.shipping_free")
              : formatPrice(order.shippingTotal)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2 font-medium">
          <dt className="tracking-brand uppercase">{t("checkout.total")}</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
      </dl>

      <div className="mt-10 border-t border-line pt-6 text-sm">
        <h2 className="text-xs font-medium tracking-brand uppercase">
          {t("account.order.delivery_heading")}
        </h2>
        <p className="mt-3">
          {order.customerName} · {order.phone}
        </p>
        <p className="mt-1 text-ink/70">
          {order.city}, {order.address}
        </p>
        {order.note && (
          <p className="mt-1 text-ink/50">
            {t("account.order.note_prefix")}: {order.note}
          </p>
        )}
        <p className="mt-3">
          {t("checkout.payment_method")}: {t(order.paymentMethodKey)}
        </p>
      </div>

      <Link href={path("/account")} className="btn-ghost mt-10 inline-block text-xs">
        {t("account.order.back")}
      </Link>
    </div>
  );
}
