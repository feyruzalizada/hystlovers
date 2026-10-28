"use client";

import { toast } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";
import { useState } from "react";

type Option = { label: string; value: string };

/** The status column as a select, saved on change, like the source panel's SelectColumn. */
export default function OrderStatusCell({ cellData, rowData, field }: DefaultCellComponentProps) {
  const [status, setStatus] = useState(String(cellData ?? ""));
  const [saving, setSaving] = useState(false);
  const options = ("options" in field ? field.options : []) as Option[];

  const change = async (next: string) => {
    const previous = status;
    setStatus(next);
    setSaving(true);
    const response = await fetch(`/api/orders/${rowData.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => null);
    setSaving(false);
    if (response?.ok) toast.success(`Order ${rowData.number} updated`);
    else {
      setStatus(previous);
      toast.error("Could not update the order");
    }
  };

  return (
    <select
      className="order-status-cell"
      value={status}
      disabled={saving}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => void change(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
