import { notFound, redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { getCustomer } from "@/lib/auth";
import { isLocale, localePath } from "@/lib/i18n";
import type { Metadata } from "next";
import { getTranslator } from "@/lib/server-i18n";
import { localeAlternates } from "@/lib/alternates";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("checkout.title"), alternates: localeAlternates("/checkout") };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const customer = await getCustomer();
  if (!customer) redirect(localePath(locale, "/login"));

  return <CheckoutForm defaultName={customer.name} />;
}
