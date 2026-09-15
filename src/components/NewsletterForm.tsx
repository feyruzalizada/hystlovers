"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/app/actions/shop";
import { useI18n } from "./I18nProvider";

export default function NewsletterForm() {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("locale", locale);

    startTransition(async () => {
      const result = await subscribeNewsletter(data);
      if (result.ok) {
        form.reset();
        setError(null);
        setDone(true);
      } else {
        setError(result.message);
      }
    });
  }

  if (done) {
    return <p className="mt-4 text-sm text-ink-soft">{t("footer.newsletter.success")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex max-w-md flex-wrap gap-3">
      <input
        name="email"
        type="email"
        required
        placeholder={t("footer.newsletter.placeholder")}
        className="input-brand flex-1"
      />
      <button type="submit" className="btn-primary whitespace-nowrap" disabled={pending}>
        {t("footer.newsletter.submit")}
      </button>
      {error && <p className="w-full text-xs text-sale">{error}</p>}
    </form>
  );
}
