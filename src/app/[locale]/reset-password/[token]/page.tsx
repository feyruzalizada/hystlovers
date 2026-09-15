import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/AuthForms";
import { isLocale } from "@/lib/i18n";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  return <ResetPasswordForm token={token} />;
}
