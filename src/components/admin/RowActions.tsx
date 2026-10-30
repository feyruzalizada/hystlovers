"use client";

import { toast } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./icons";

export type RowAction = "edit" | "view" | "replicate" | "delete";

type Props = DefaultCellComponentProps & { actions: RowAction[] };

/** The source table's row actions: Edit or View, Replicate, Delete. */
export default function RowActions({ rowData, collectionSlug, actions }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const href = `/admin/collections/${collectionSlug}/${rowData.id}`;

  const call = async (method: "POST" | "DELETE", url: string, done: string) => {
    setBusy(true);
    const response = await fetch(url, { method, credentials: "include" }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      toast.success(done);
      router.refresh();
    } else {
      toast.error("Could not complete the action");
    }
  };

  return (
    <span className="row-actions" onClick={(event) => event.stopPropagation()}>
      {actions.map((action) => {
        if (action === "edit" || action === "view") {
          return (
            <Link key={action} href={href} className={`row-actions__link${action === "view" ? " row-actions__link--gray" : ""}`}>
              <Icon name={action} />
              {action === "edit" ? "Edit" : "View"}
            </Link>
          );
        }
        if (action === "replicate") {
          return (
            <button
              key={action}
              type="button"
              className="row-actions__link"
              disabled={busy}
              onClick={() => void call("POST", `/api/${collectionSlug}/${rowData.id}/duplicate`, "Replicated")}
            >
              <Icon name="replicate" />
              Replicate
            </button>
          );
        }
        return (
          <button
            key={action}
            type="button"
            className="row-actions__link row-actions__link--danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Delete this record? This cannot be undone.")) {
                void call("DELETE", `/api/${collectionSlug}/${rowData.id}`, "Deleted");
              }
            }}
          >
            <Icon name="trash" />
            Delete
          </button>
        );
      })}
    </span>
  );
}
