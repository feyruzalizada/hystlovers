"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { login, register, requestPasswordReset, resetPassword } from "@/app/actions/auth";
import { useI18n } from "./I18nProvider";

type ActionResult = { ok: true } | { ok: false; message: string };

const LABEL = "mb-2 block text-xs font-medium tracking-brand uppercase";

function useAuthSubmit(action: (data: FormData) => Promise<ActionResult | void>) {
  const { locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("locale", locale);

    startTransition(async () => {
      setError(null);
      const result = await action(data);
      // A successful login or registration redirects and returns nothing.
      if (result && !result.ok) setError(result.message);
      else if (result) setDone(true);
    });
  };

  return { onSubmit, pending, error, done };
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input name={name} type={type} required autoComplete={autoComplete} className="input-brand" />
    </label>
  );
}

export function LoginForm() {
  const { t, path } = useI18n();
  const { onSubmit, pending, error } = useAuthSubmit(login);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <h1 className="heading-brand text-center text-2xl">{t("auth.login.title")}</h1>

      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
        <Field label={t("auth.email")} name="email" type="email" autoComplete="email" />
        <Field
          label={t("auth.password")}
          name="password"
          type="password"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-ink/60">
            <input type="checkbox" name="remember" defaultChecked className="accent-ink" />
            {t("auth.login.remember")}
          </label>
          <Link
            href={path("/forgot-password")}
            className="text-xs text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            {t("auth.login.forgot")}
          </Link>
        </div>

        {error && <p className="text-xs text-sale">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? t("auth.login.submitting") : t("auth.login.title")}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink/60">
        {t("auth.login.no_account")}{" "}
        <Link href={path("/register")} className="text-ink underline underline-offset-4">
          {t("auth.login.register_link")}
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const { t, path } = useI18n();
  const { onSubmit, pending, error } = useAuthSubmit(register);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <h1 className="heading-brand text-center text-2xl">{t("auth.register.title")}</h1>
      <p className="mt-4 text-center text-sm text-ink/60">{t("auth.register.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
        <Field label={t("auth.register.name")} name="name" autoComplete="name" />
        <Field label={t("auth.email")} name="email" type="email" autoComplete="email" />
        <Field
          label={t("auth.password")}
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <Field
          label={t("auth.register.password_confirm")}
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
        />

        {error && <p className="text-xs text-sale">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? t("auth.register.submitting") : t("auth.register.title")}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink/60">
        {t("auth.register.have_account")}{" "}
        <Link href={path("/login")} className="text-ink underline underline-offset-4">
          {t("auth.register.login_link")}
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const { t, path } = useI18n();
  const { onSubmit, pending, error, done } = useAuthSubmit(requestPasswordReset);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <h1 className="heading-brand text-center text-2xl">{t("auth.forgot.title")}</h1>
      <p className="mt-4 text-center text-sm text-ink/60">{t("auth.forgot.subtitle")}</p>

      {done ? (
        <div className="mt-10 text-center">
          <p className="bg-mist px-4 py-3 text-xs">{t("auth.forgot.sent")}</p>
          <Link href={path("/login")} className="btn-ghost mt-8 inline-block text-xs">
            {t("auth.forgot.back")}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
          <Field label={t("auth.email")} name="email" type="email" autoComplete="email" />
          {error && <p className="text-xs text-sale">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
          </button>
          <Link href={path("/login")} className="btn-ghost text-xs">
            {t("auth.forgot.back")}
          </Link>
        </form>
      )}
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const { onSubmit, pending, error } = useAuthSubmit(resetPassword);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <h1 className="heading-brand text-center text-2xl">{t("auth.reset.title")}</h1>

      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />
        <Field
          label={t("auth.reset.password")}
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <Field
          label={t("auth.reset.password_confirm")}
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
        />

        {error && <p className="text-xs text-sale">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? t("auth.reset.submitting") : t("auth.reset.submit")}
        </button>
      </form>
    </div>
  );
}
