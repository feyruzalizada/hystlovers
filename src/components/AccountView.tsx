"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { payOrder } from "@/app/actions/checkout";
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
                <span className="bg-ink px-2 py-1 text-[10px] tracking-wide2 text-paper uppercase">
                  {t("product.preorder.badge")}
                </span>
              )}
              <span className="bg-mist px-3 py-1 text-[11px] tracking-wide2 uppercase">
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

/** Sends the shopper to the bank's payment page for an unpaid card order. */
function PayButton({ number, total }: { number: string; total: number }) {
  const { t, locale } = useI18n();
  const { formatPrice } = useShop();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Stays set while the browser leaves for the bank.
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = () =>
    startTransition(async () => {
      setError(null);
      const result = await payOrder({ locale, number });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (!result.paymentUrl) {
        router.refresh();
        return;
      }
      setLeaving(true);
      window.location.assign(result.paymentUrl);
    });

  return (
    <div className="mt-8">
      {error && <p className="mb-3 bg-sale/10 px-4 py-3 text-xs text-sale">{error}</p>}
      <button type="button" className="btn-primary w-full sm:w-auto" disabled={pending || leaving} onClick={pay}>
        {pending || leaving ? t("checkout.redirecting") : t("account.order.pay", { total: formatPrice(total) })}
      </button>
    </div>
  );
}

export function OrderDetail({
  order,
  bankDetails,
  justPlaced,
  payment,
}: {
  order: OrderView;
  bankDetails: string | null;
  justPlaced?: boolean;
  payment?: "success" | "failed" | "error";
}) {
  const { t, path } = useI18n();
  const { formatPrice } = useShop();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {payment === "success" ? (
        <p className="mb-8 bg-mist px-5 py-4 text-sm">{t("account.order.payment_success")}</p>
      ) : payment ? (
        <p className="mb-8 bg-sale/10 px-5 py-4 text-sm text-sale">{t(`account.order.payment_${payment}`)}</p>
      ) : (
        justPlaced && <p className="mb-8 bg-mist px-5 py-4 text-sm">{t("account.order.placed_flash")}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="heading-brand text-lg sm:text-2xl">{order.number}</h1>
        <div className="flex items-center gap-2">
          <span className="bg-mist px-3 py-1 text-[11px] tracking-wide2 uppercase">
            {t(order.statusKey)}
          </span>
          <span className="bg-mist px-3 py-1 text-[11px] tracking-wide2 uppercase">
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

      {order.canPay && <PayButton number={order.number} total={order.total} />}

      {bankDetails && (
        <div className="mt-8 border border-line bg-mist/60 p-5 text-sm">
          <h2 className="text-xs font-medium tracking-wide2 uppercase">
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
                  className="text-xs tracking-wide2 uppercase underline-offset-4 hover:underline"
                >
                  {item.name}
                </Link>
              ) : (
                <p className="text-xs tracking-wide2 uppercase">{item.name}</p>
              )}
              {item.isPreorder && (
                <span className="ml-2 bg-ink px-1.5 py-0.5 text-[10px] tracking-wide2 text-paper uppercase">
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

      <dl className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
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
          <dt className="tracking-wide2 uppercase">{t("checkout.total")}</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
      </dl>

      <div className="mt-10 border-t border-line pt-6 text-sm">
        <h2 className="text-xs font-medium tracking-wide2 uppercase">
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
