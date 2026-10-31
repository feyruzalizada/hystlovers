"use client";

import { toast, useDocumentInfo, useDocumentTitle } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, type Crumb } from "./PageHeader";

type Panel = { title?: string; singular?: string; viewPage?: boolean };

/** The source panel's form header: breadcrumbs, "Create Category" / "Edit Sets", and Delete. */
export default function DocHeading() {
  const { id, collectionSlug, globalSlug, docConfig, docPermissions } = useDocumentInfo();
  const { title } = useDocumentTitle();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const custom = (docConfig?.admin as { custom?: { panel?: Panel } } | undefined)?.custom;
  const panel = custom?.panel ?? {};
  const label = (docConfig as { label?: unknown } | undefined)?.label;

  if (globalSlug) {
    return <PageHeader crumbs={[]} title={typeof label === "string" ? label : String(title ?? "")} />;
  }

  const list = `/admin/collections/${collectionSlug}`;
  const plural = panel.title ?? String(collectionSlug);
  const crumbs: Crumb[] = [{ label: plural, href: list }];
  if (id && title) crumbs.push({ label: String(title), href: `${list}/${id}${panel.viewPage ? "/view" : ""}` });
  crumbs.push({ label: id ? "Edit" : "Create" });

  const canDelete = Boolean(id) && Boolean((docPermissions as { delete?: boolean } | undefined)?.delete);

  const remove = async () => {
    if (!window.confirm(`Delete ${title}? This cannot be undone.`)) return;
    setDeleting(true);
    const response = await fetch(`/api/${collectionSlug}/${id}`, { method: "DELETE", credentials: "include" }).catch(
      () => null,
    );
    setDeleting(false);
    if (response?.ok) {
      toast.success("Deleted");
      router.push(list);
    } else {
      toast.error("Could not delete");
    }
  };

  return (
    <PageHeader
      crumbs={crumbs}
      title={id ? `Edit ${title}` : `Create ${panel.singular ?? ""}`.trim()}
      actions={
        canDelete ? (
          <button type="button" className="fi-btn fi-btn--danger" disabled={deleting} onClick={() => void remove()}>
            Delete
          </button>
        ) : undefined
      }
    />
  );
}
