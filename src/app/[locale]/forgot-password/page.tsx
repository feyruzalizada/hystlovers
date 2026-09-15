import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/AuthForms";
import { getCustomer } from "@/lib/auth";
import { isLocale, localePath } from "@/lib/i18n";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getCustomer()) redirect(localePath(locale, "/account"));
  return <ForgotPasswordForm />;
}
