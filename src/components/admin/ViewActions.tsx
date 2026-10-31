"use client";

import { toast } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { label: string; value: string };

const patch = async (url: string, data: Record<string, unknown>) =>
  fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => null);

/** "Update status": the order's status and payment status in a small dialog, as on the source view page. */
export function UpdateStatus({
  id,
  status,
  paymentStatus,
  statuses,
  paymentStatuses,
}: {
  id: number | string;
  status: string;
  paymentStatus: string;
  statuses: Option[];
  paymentStatuses: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState({ status, paymentStatus });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const response = await patch(`/api/orders/${id}`, next);
    setSaving(false);
    if (response?.ok) {
      toast.success("Order updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Could not update the order");
    }
  };

  return (
    <>
      <button type="button" className="fi-btn fi-btn--primary" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width="20" height="20" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        Update status
      </button>
      {open && (
        <div className="fi-modal" role="dialog" aria-modal="true" aria-label="Update status">
          <div className="fi-modal__panel">
            <h2 className="fi-modal__title">Update status</h2>
            <label className="fi-modal__field">
              <span>
                Status<sup>*</sup>
              </span>
              <select value={next.status} onChange={(event) => setNext({ ...next, status: event.target.value })}>
                {statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="fi-modal__field">
              <span>
                Payment<sup>*</sup>
              </span>
              <select
                value={next.paymentStatus}
                onChange={(event) => setNext({ ...next, paymentStatus: event.target.value })}
              >
                {paymentStatuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="fi-modal__actions">
              <button type="button" className="fi-btn fi-btn--primary" disabled={saving} onClick={() => void save()}>
                Submit
              </button>
              <button type="button" className="fi-btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** "Grant panel access" / "Revoke panel access", confirmed first. */
export function PanelAccess({ id, granted }: { id: number | string; granted: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const label = granted ? "Revoke panel access" : "Grant panel access";

  const toggle = async () => {
    if (!window.confirm(`${label}?`)) return;
    setSaving(true);
    const response = await patch(`/api/customers/${id}`, { panelAccess: !granted });
    setSaving(false);
    if (response?.ok) {
      toast.success(granted ? "Panel access revoked" : "Panel access granted");
      router.refresh();
    } else {
      toast.error("Could not change panel access");
    }
  };

  return (
    <button
      type="button"
      className={`fi-btn ${granted ? "fi-btn--danger" : "fi-btn--primary"}`}
      disabled={saving}
      onClick={() => void toggle()}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width="20" height="20" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
        />
      </svg>
      {label}
    </button>
  );
}

/** Delete from the view page, then back to the list. */
export function DeleteRecord({ collection, id }: { collection: string; id: number | string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const remove = async () => {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    setSaving(true);
    const response = await fetch(`/api/${collection}/${id}`, { method: "DELETE", credentials: "include" }).catch(
      () => null,
    );
    setSaving(false);
    if (response?.ok) {
      toast.success("Deleted");
      router.push(`/admin/collections/${collection}`);
    } else {
      toast.error("Could not delete");
    }
  };

  return (
    <button type="button" className="fi-btn fi-btn--danger" disabled={saving} onClick={() => void remove()}>
      Delete
    </button>
  );
}

/** This panel's own extra: the full form behind the view page. */
export function EditRecord({ href }: { href: string }) {
  return (
    <Link href={href} className="fi-btn">
      Edit
    </Link>
  );
}
