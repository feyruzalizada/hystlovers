"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";

export default function ContactForm({ subjects }: { subjects: string[] }) {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    setMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, locale }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setStatus("error");
        setMessage(
          response.status === 429
            ? t("contact.rate_limited", { seconds: body.retryAfter ?? 60 })
            : (body.message ?? t("error.404.title")),
        );
        return;
      }

      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
      setMessage(t("error.404.body"));
    }
  }

  if (status === "sent") {
    return (
      <div className="border border-line p-8 text-center">
        <h2 className="heading-brand text-sm">{t("contact.sent.title")}</h2>
        <p className="mt-3 text-sm text-ink-soft">{t("contact.sent.body")}</p>
        <button type="button" className="btn-secondary mt-6" onClick={() => setStatus("idle")}>
          {t("contact.sent.new_message")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-xs tracking-brand uppercase">{t("contact.name")}</span>
        <input name="name" required maxLength={120} className="input-brand" />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs tracking-brand uppercase">{t("contact.email")}</span>
        <input name="email" type="email" required className="input-brand" />
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
        <textarea name="message" required rows={6} maxLength={2000} className="input-brand" />
      </label>

      {message && <p className="text-xs text-sale">{message}</p>}

      <button type="submit" className="btn-primary self-start" disabled={status === "sending"}>
        {status === "sending" ? t("contact.submitting") : t("contact.submit")}
      </button>
    </form>
  );
}
