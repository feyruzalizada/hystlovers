import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslator } from "@/lib/server-i18n";
import { defaultLocale, isLocale, localePath } from "@/lib/i18n";

export default async function NotFound() {
  // A not-found page gets no route params, so the language comes from the
  // cookie the proxy writes on every localized request.
  const remembered = (await cookies()).get("storefront_locale")?.value ?? "";
  const locale = isLocale(remembered) ? remembered : defaultLocale;
  const t = await getTranslator(locale);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:py-32">
      <p className="heading-brand text-6xl text-ink/15">404</p>
      <h1 className="heading-brand mt-6 text-xl">{t("error.404.title")}</h1>
      <p className="mt-4 text-sm text-ink/60">{t("error.404.body")}</p>
      <Link href={localePath(locale, "/")} className="btn-primary mt-10">
        {t("error.404.cta")}
      </Link>
    </div>
  );
}
