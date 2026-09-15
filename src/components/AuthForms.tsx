"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { login, register, requestPasswordReset, resetPassword } from "@/app/actions/auth";
import { useI18n } from "./I18nProvider";

type ActionResult = { ok: true } | { ok: false; message: string };

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
      // A successful login/register redirects and never returns a result.
      if (result && !result.ok) setError(result.message);
      else if (result) setDone(true);
    });
  };

  return { onSubmit, pending, error, done };
}

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-20 md:px-0">
      <h1 className="heading-brand text-center text-lg">{title}</h1>
      {subtitle && <p className="mt-3 text-center text-sm text-ink-soft">{subtitle}</p>}
      <div className="mt-10">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = true,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs tracking-brand uppercase">{label}</span>
      <input name={name} type={type} required={required} autoComplete={autoComplete} className="input-brand" />
    </label>
  );
}

export function LoginForm() {
  const { t, path } = useI18n();
  const { onSubmit, pending, error } = useAuthSubmit(login);

  return (
    <Shell title={t("auth.login.title")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label={t("auth.email")} name="email" type="email" autoComplete="email" />
        <Field label={t("auth.password")} name="password" type="password" autoComplete="current-password" />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 tracking-brand uppercase">
            <input type="checkbox" name="remember" defaultChecked />
            {t("auth.login.remember")}
          </label>
          <Link href={path("/forgot-password")} className="underline underline-offset-4">
            {t("auth.login.forgot")}
          </Link>
        </div>

        {error && <p className="text-xs text-sale">{error}</p>}

        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? t("auth.login.submitting") : t("auth.login.title")}
        </button>

        <p className="text-center text-xs text-ink-soft">
          {t("auth.login.no_account")}{" "}
          <Link href={path("/register")} className="underline underline-offset-4">
            {t("auth.login.register_link")}
          </Link>
        </p>
      </form>
    </Shell>
  );
}

export function RegisterForm() {
  const { t, path } = useI18n();
  const { onSubmit, pending, error } = useAuthSubmit(register);

  return (
    <Shell title={t("auth.register.title")} subtitle={t("auth.register.subtitle")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label={t("auth.register.name")} name="name" autoComplete="name" />
        <Field label={t("auth.email")} name="email" type="email" autoComplete="email" />
        <Field label={t("auth.password")} name="password" type="password" autoComplete="new-password" />
        <Field
          label={t("auth.register.password_confirm")}
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
        />

        {error && <p className="text-xs text-sale">{error}</p>}

        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? t("auth.register.submitting") : t("auth.register.title")}
        </button>

        <p className="text-center text-xs text-ink-soft">
          {t("auth.register.have_account")}{" "}
          <Link href={path("/login")} className="underline underline-offset-4">
            {t("auth.register.login_link")}
          </Link>
        </p>
      </form>
    </Shell>
  );
}

export function ForgotPasswordForm() {
  const { t, path } = useI18n();
  const { onSubmit, pending, error, done } = useAuthSubmit(requestPasswordReset);

  return (
    <Shell title={t("auth.forgot.title")} subtitle={t("auth.forgot.subtitle")}>
      {done ? (
        <div className="text-center">
          <p className="text-sm text-ink-soft">{t("auth.forgot.sent")}</p>
          <Link href={path("/login")} className="btn-secondary mt-8">
            {t("auth.forgot.back")}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <Field label={t("auth.email")} name="email" type="email" autoComplete="email" />
          {error && <p className="text-xs text-sale">{error}</p>}
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
          </button>
          <Link href={path("/login")} className="btn-ghost self-center">
            {t("auth.forgot.back")}
          </Link>
        </form>
      )}
    </Shell>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const { onSubmit, pending, error } = useAuthSubmit(resetPassword);

  return (
    <Shell title={t("auth.reset.title")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />
        <Field label={t("auth.reset.password")} name="password" type="password" autoComplete="new-password" />
        <Field
          label={t("auth.reset.password_confirm")}
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
        />
        {error && <p className="text-xs text-sale">{error}</p>}
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? t("auth.reset.submitting") : t("auth.reset.submit")}
        </button>
      </form>
    </Shell>
  );
}
