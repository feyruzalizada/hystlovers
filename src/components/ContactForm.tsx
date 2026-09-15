"use client";

import { useState, useTransition } from "react";
import { submitContact } from "@/app/actions/shop";
import { useI18n } from "./I18nProvider";

export default function ContactForm({ subjects }: { subjects: string[] }) {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("locale", locale);

    startTransition(async () => {
      const result = await submitContact(data);
      if (result.ok) {
        form.reset();
        setError(null);
        setSent(true);
      } else {
        setError(result.message);
      }
    });
  }

  if (sent) {
    return (
      <div className="border border-line p-8 text-center">
        <h2 className="heading-brand text-sm">{t("contact.sent.title")}</h2>
        <p className="mt-3 text-sm text-ink-soft">{t("contact.sent.body")}</p>
        <button type="button" className="btn-secondary mt-6" onClick={() => setSent(false)}>
          {t("contact.sent.new_message")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-xs tracking-brand uppercase">{t("contact.name")}</span>
        <input name="name" required maxLength={255} className="input-brand" />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs tracking-brand uppercase">{t("contact.email")}</span>
        <input name="email" type="email" required maxLength={255} className="input-brand" />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs tracking-brand uppercase">{t("contact.subject")}</span>
        <select name="subject" required className="input-brand">
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {t(`contact.subject.${subject}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs tracking-brand uppercase">{t("contact.message")}</span>
        <textarea name="message" required rows={6} maxLength={5000} className="input-brand" />
      </label>

      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
      />

      {error && <p className="text-xs text-sale">{error}</p>}

      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? t("contact.submitting") : t("contact.submit")}
      </button>
    </form>
  );
}
