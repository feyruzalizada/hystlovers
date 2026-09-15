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
    <div className="mx-auto max-w-[900px] px-4 py-16 md:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="heading-brand text-lg">{t("account.title")}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {customer.name} · {customer.email}
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-12">
        <h2 className="heading-brand text-xs">{t("account.orders_heading")}</h2>
        <OrderList orders={orders} />
      </section>
    </div>
  );
}
