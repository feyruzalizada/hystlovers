import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { getContactDetails } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { localeAlternates } from "@/lib/alternates";
import { isLocale, locales } from "@/lib/i18n";
import { CONTACT_SUBJECTS } from "@/collections/Commerce";

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
  const t = await getTranslator(locale);
  return {
    title: t("contact.title"),
    description: t("contact.meta_description"),
    alternates: localeAlternates("/contact"),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [t, details] = await Promise.all([getTranslator(locale), getContactDetails(locale)]);
  const heading = "text-xs font-medium tracking-brand uppercase";

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <h1 className="heading-brand text-center text-2xl sm:text-3xl">{t("contact.title")}</h1>
      <p className="mx-auto mt-4 max-w-md text-center text-sm text-ink/60">{t("contact.subtitle")}</p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
        <ContactForm subjects={[...CONTACT_SUBJECTS]} />

        <aside className="space-y-8 border-t border-line pt-8 text-sm lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
          {details.email && (
            <div>
              <p className={heading}>{t("contact.details.email")}</p>
              <a href={`mailto:${details.email}`} className="mt-2 block text-ink/70 hover:text-ink">
                {details.email}
              </a>
            </div>
          )}
          {details.phone && (
            <div>
              <p className={heading}>{t("contact.details.phone")}</p>
              <a
                href={`tel:${details.phone.replace(/\s/g, "")}`}
                className="mt-2 block text-ink/70 hover:text-ink"
              >
                {details.phone}
              </a>
            </div>
          )}
          {details.whatsapp && (
            <div>
              <p className={heading}>{t("contact.details.whatsapp")}</p>
              <p className="mt-2 text-ink/70">{details.whatsapp}</p>
            </div>
          )}
          {details.workingHours && (
            <div>
              <p className={heading}>{t("contact.details.hours")}</p>
              <p className="mt-2 text-ink/70">{details.workingHours}</p>
            </div>
          )}
          {details.address && (
            <div>
              <p className={heading}>{t("contact.details.address")}</p>
              <p className="mt-2 text-ink/70">{details.address}</p>
            </div>
          )}
          {details.socials.length > 0 && (
            <div>
              <p className={heading}>{t("contact.details.socials")}</p>
              <ul className="mt-2 space-y-1.5 text-ink/70">
                {details.socials.map((social) => (
                  <li key={social.name}>
                    <span className="text-ink/40">{social.name}:</span> {social.handle}
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
