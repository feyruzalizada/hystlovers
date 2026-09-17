"use client";

import { useState, useTransition } from "react";
import { submitContact } from "@/app/actions/shop";
import { useI18n } from "./I18nProvider";
import Icon from "./Icon";

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
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Icon name="check" size={32} />
        <p className="heading-brand text-sm">{t("contact.sent.title")}</p>
        <p className="text-sm text-ink/60">{t("contact.sent.body")}</p>
        <button type="button" className="btn-ghost mt-4" onClick={() => setSent(false)}>
          {t("contact.sent.new_message")}
        </button>
      </div>
    );
  }

  const fieldLabel = "mb-2 block text-xs font-medium tracking-brand uppercase";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={fieldLabel}>{t("contact.name")}</span>
          <input name="name" type="text" required maxLength={255} className="input-brand" />
        </label>
        <label className="block">
          <span className={fieldLabel}>{t("contact.email")}</span>
          <input name="email" type="email" required maxLength={255} className="input-brand" />
        </label>
      </div>

      <label className="block">
        <span className={fieldLabel}>{t("contact.subject")}</span>
        <select name="subject" className="input-brand" defaultValue={subjects[0]}>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {t(`contact.subject.${subject}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={fieldLabel}>{t("contact.message")}</span>
        <textarea name="message" rows={6} required maxLength={5000} className="input-brand resize-none" />
      </label>

      {/* Honeypot: hidden from real users, bots fill it in. */}
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error && <p className="text-xs text-sale">{error}</p>}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? t("contact.submitting") : t("contact.submit")}
      </button>
    </form>
  );
}
