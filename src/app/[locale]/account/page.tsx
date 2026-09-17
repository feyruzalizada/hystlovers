import { notFound, redirect } from "next/navigation";
import { LogoutButton, OrderList } from "@/components/AccountView";
import { getCustomer } from "@/lib/auth";
import { getOrdersFor } from "@/lib/orders";
import { getTranslator } from "@/lib/server-i18n";
import { isLocale, localePath } from "@/lib/i18n";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const customer = await getCustomer();
  if (!customer) redirect(localePath(locale, "/login"));

  const [t, orders] = await Promise.all([getTranslator(locale), getOrdersFor(customer.id)]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading-brand text-2xl">{t("account.title")}</h1>
          <p className="mt-2 text-sm text-ink/60">
            {customer.name} · {customer.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <h2 className="mt-12 text-xs font-medium tracking-brand uppercase">
        {t("account.orders_heading")}
      </h2>

      <OrderList orders={orders} />
    </div>
  );
}
