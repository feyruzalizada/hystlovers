"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/app/actions/shop";
import { useI18n } from "./I18nProvider";
import Icon from "./Icon";

export default function NewsletterForm() {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [subscribed, setSubscribed] = useState(false);
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
        setSubscribed(true);
      } else {
        setError(result.message);
      }
    });
  }

  if (subscribed) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-paper/80">
        <Icon name="check" size={16} />
        {t("footer.newsletter.success")}
      </p>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-4 flex">
        <input
          name="email"
          type="email"
          required
          placeholder={t("footer.newsletter.placeholder")}
          className="w-full border border-paper/25 bg-transparent px-4 py-3 text-sm placeholder:text-paper/40 focus:border-paper focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={t("footer.newsletter.submit")}
          className="shrink-0 border border-l-0 border-paper/25 px-4 transition-colors hover:bg-paper hover:text-ink"
        >
          <Icon name="arrow-right" size={18} />
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-paper/70">{error}</p>}
    </>
  );
}
