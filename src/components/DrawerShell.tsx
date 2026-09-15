"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";
import { useI18n } from "./I18nProvider";

/**
 * Sliding panel used by the mobile menu and the cart. Locks background scroll
 * while open and closes on Esc or a click on the backdrop.
 */
export default function DrawerShell({
  open,
  title,
  side = "right",
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  side?: "left" | "right";
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = useI18n();
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    panel.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/40" aria-hidden="true" onClick={onClose} />
      <aside
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed inset-y-0 z-50 flex w-full max-w-[26rem] flex-col bg-paper focus:outline-none ${
          side === "right" ? "right-0" : "left-0"
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="heading-brand text-sm">{title}</h2>
          <button
            type="button"
            className="-m-2 p-2 transition-opacity hover:opacity-60"
            aria-label={t("general.close")}
            onClick={onClose}
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer}
      </aside>
    </>
  );
}
