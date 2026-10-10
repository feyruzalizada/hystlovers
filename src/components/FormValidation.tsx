"use client";

import { useEffect } from "react";
import { useI18n } from "./I18nProvider";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Browsers word their own "please fill in this field" bubbles in the browser's
 * language, not the page's; this swaps them for the site texts of the page.
 */
export function FormValidation() {
  const { t } = useI18n();

  useEffect(() => {
    const onInvalid = (event: Event) => {
      const field = event.target as Field;
      const { validity } = field;
      if (validity.customError && field.dataset.siteMessage !== field.validationMessage) return;
      let message = "";
      if (validity.valueMissing) {
        const choice = field instanceof HTMLSelectElement || ["radio", "checkbox"].includes(field.type);
        message = t(choice ? "form.validation.choose" : "form.validation.required");
      } else if (validity.typeMismatch && field.type === "email") {
        message = t("form.validation.email");
      }
      if (!message) return;
      field.dataset.siteMessage = message;
      field.setCustomValidity(message);
    };

    const onEdit = (event: Event) => {
      const field = event.target as Field;
      const group =
        field instanceof HTMLInputElement && field.type === "radio" && field.form
          ? [...field.form.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(field.name)}"]`)]
          : [field];
      for (const member of group) {
        if (!member.dataset.siteMessage) continue;
        member.setCustomValidity("");
        delete member.dataset.siteMessage;
      }
    };

    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
    };
  }, [t]);

  return null;
}
