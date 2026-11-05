"use client";

import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";

type DropdownProps = {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  /** Which edge of the trigger the panel lines up with. */
  align?: "start" | "end";
  className?: string;
  onOpen?: () => void;
};

/**
 * A panel under its trigger, as the source panel's dropdowns. It is drawn on
 * the body, so a link or a scrolling table around the trigger cannot clip or
 * swallow it.
 */
export function Dropdown({ trigger, children, align = "end", className, onOpen }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const measure = useCallback(() => {
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    setPlace(
      align === "end"
        ? { top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) }
        : { top: rect.bottom + 8, left: Math.max(8, rect.left) },
    );
  }, [align]);

  useLayoutEffect(() => {
    if (open) measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  return (
    <>
      <button
        ref={button}
        type="button"
        className={["fi-dropdown-trigger", className && `${className}__trigger`].filter(Boolean).join(" ")}
        aria-expanded={open}
        onClick={(event) => {
          // The avatar sits inside the header's account link.
          event.preventDefault();
          event.stopPropagation();
          if (!open) onOpen?.();
          setOpen(!open);
        }}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div ref={panel} className={["fi-dropdown", className].filter(Boolean).join(" ")} style={{ position: "fixed", ...place }}>
            {children(close)}
          </div>,
          document.body,
        )}
    </>
  );
}

type ModalProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** The source panel's confirmation: a red trash badge, the question, Cancel and a red button. */
export function ConfirmModal({
  title,
  description = "Are you sure you would like to do this?",
  confirmLabel = "Delete",
  busy,
  onCancel,
  onConfirm,
}: ModalProps) {
  useEffect(() => {
    const escape = (event: KeyboardEvent) => event.key === "Escape" && onCancel();
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [onCancel]);

  return createPortal(
    <div className="fi-modal" role="dialog" aria-modal aria-label={title}>
      <div className="fi-modal__backdrop" onClick={onCancel} />
      <div className="fi-modal__window fi-modal__window--confirm">
        <button type="button" className="fi-modal__close" aria-label="Close" onClick={onCancel}>
          <Icon name="xMark" />
        </button>
        <span className="fi-modal__icon">
          <Icon name="trashOutline" size={24} />
        </span>
        <h2 className="fi-modal__title">{title}</h2>
        <p className="fi-modal__description">{description}</p>
        <div className="fi-modal__actions">
          <button type="button" className="fi-btn fi-btn--outline" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="fi-btn fi-btn--danger" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
