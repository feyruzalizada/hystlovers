"use client";

import { toast } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";
import { useState } from "react";

/** A checkbox column switched straight from the list, like the source panel's ToggleColumn. */
export default function ToggleCell({ cellData, rowData, field, collectionSlug }: DefaultCellComponentProps) {
  const [on, setOn] = useState(Boolean(cellData));
  const [saving, setSaving] = useState(false);
  const name = "name" in field ? field.name : "";
  const label = "label" in field && typeof field.label === "string" ? field.label : name;

  const flip = async () => {
    const next = !on;
    setOn(next);
    setSaving(true);
    const response = await fetch(`/api/${collectionSlug}/${rowData.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [name]: next }),
    }).catch(() => null);
    setSaving(false);
    if (response?.ok) toast.success(`${label}: ${next ? "on" : "off"}`);
    else {
      setOn(!next);
      toast.error("Could not save the change");
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle-cell${on ? " toggle-cell--on" : ""}`}
      disabled={saving}
      onClick={(event) => {
        event.stopPropagation();
        void flip();
      }}
    />
  );
}
