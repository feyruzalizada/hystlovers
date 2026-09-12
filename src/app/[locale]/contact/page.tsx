import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { getContact } from "@/lib/data";
import { createTranslator, isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  return { title: t("contact.title"), description: t("contact.meta_description") };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = createTranslator(locale);
  const { details, subjects } = getContact();

  const rows: { label: string; value: string | null; href?: string }[] = [
    { label: t("contact.details.email"), value: details.email, href: `mailto:${details.email}` },
    { label: t("contact.details.phone"), value: details.phone, href: `tel:${details.phone}` },
    {
      label: t("contact.details.whatsapp"),
      value: details.whatsapp,
      href: `https://wa.me/${details.whatsapp?.replace(/\D/g, "")}`,
    },
    { label: t("contact.details.address"), value: details.address },
    { label: t("contact.details.hours"), value: details.workingHours },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8">
      <header className="mb-12">
        <h1 className="heading-brand text-xl">{t("contact.title")}</h1>
        <p className="mt-3 max-w-xl text-sm text-ink-soft">{t("contact.subtitle")}</p>
      </header>

      <div className="grid gap-16 md:grid-cols-[1fr_320px]">
        <ContactForm subjects={subjects} />

        <aside className="flex flex-col gap-6 border-t border-line pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10">
          {rows
            .filter((row) => row.value)
            .map((row) => (
              <div key={row.label}>
                <p className="text-xs tracking-brand text-ink-soft uppercase">{row.label}</p>
                {row.href ? (
                  <a href={row.href} className="mt-1 block text-sm hover:underline">
                    {row.value}
                  </a>
                ) : (
                  <p className="mt-1 text-sm">{row.value}</p>
                )}
              </div>
            ))}

          {details.socials.length > 0 && (
            <div>
              <p className="text-xs tracking-brand text-ink-soft uppercase">
                {t("contact.details.socials")}
              </p>
              <ul className="mt-1 flex flex-col gap-1">
                {details.socials.map((social) => (
                  <li key={social.name} className="text-sm">
                    {social.name} — {social.handle}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
