import { notFound } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { getCustomer } from "@/lib/auth";
import { isLocale, localePath } from "@/lib/i18n";
import { redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reset?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getCustomer()) redirect(localePath(locale, "/account"));
  const { reset } = await searchParams;
  return <LoginForm resetDone={reset === "1"} />;
}
