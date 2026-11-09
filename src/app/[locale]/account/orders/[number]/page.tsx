import { notFound, redirect } from "next/navigation";
import { OrderDetail } from "@/components/AccountView";
import { getCustomer } from "@/lib/auth";
import { getBankTransferDetails, getOrderFor, refreshCardPayment } from "@/lib/orders";
import { isLocale, localePath } from "@/lib/i18n";
import type { Metadata } from "next";
import { localeAlternates } from "@/lib/alternates";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}): Promise<Metadata> {
  const { locale, number } = await params;
  if (!isLocale(locale)) return {};
  return { title: number, alternates: localeAlternates(`/account/orders/${number}`) };
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; number: string }>;
  searchParams: Promise<{ placed?: string; payment?: string }>;
}) {
  const { locale, number } = await params;
  if (!isLocale(locale)) notFound();

  const customer = await getCustomer();
  if (!customer) redirect(localePath(locale, "/login"));

  await refreshCardPayment(customer.id, number);
  const order = await getOrderFor(customer.id, number, locale);
  if (!order) notFound();

  const { placed, payment } = await searchParams;
  const bankDetails = order.paymentMethod === "bank_transfer" ? await getBankTransferDetails(locale) : null;
  // "success" only once the bank has confirmed it, not from the URL alone.
  const banner =
    payment === "failed" || payment === "error" || (payment === "success" && order.paymentStatus === "paid")
      ? payment
      : undefined;

  return (
    <OrderDetail
      order={order}
      bankDetails={bankDetails}
      justPlaced={placed === "1"}
      payment={banner}
    />
  );
}
