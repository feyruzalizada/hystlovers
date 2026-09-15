import { notFound, redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { getCustomer } from "@/lib/auth";
import { isLocale, localePath } from "@/lib/i18n";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const customer = await getCustomer();
  if (!customer) redirect(localePath(locale, "/login"));

  return <CheckoutForm defaultName={customer.name} />;
}
