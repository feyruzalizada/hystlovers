"use client";

import { FieldError, FieldLabel, useField } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";

/** A colour picker next to the #rrggbb text, so a swatch can be chosen by eye. */
const ColorField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError } = useField<string>({ path });
  const hex = typeof value === "string" ? value : "";

  return (
    <div className="field-type text color-field">
      <FieldLabel label={field.label} required={field.required} path={path} />
      <div className="color-field__row">
        <input
          type="color"
          aria-label="Pick a colour"
          value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000"}
          onChange={(event) => setValue(event.target.value)}
        />
        <input
          type="text"
          className={showError ? "error" : undefined}
          value={hex}
          placeholder="#rrggbb"
          onChange={(event) => setValue(event.target.value.trim())}
        />
      </div>
      <FieldError path={path} showError={showError} />
    </div>
  );
};

export default ColorField;
