"use client";

import { useDocumentInfo, useForm } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AGAIN = "hl-create-another";

/** The buttons under the source panel's forms: Create / Create & create another / Cancel, or Save changes. */
export default function FormActions() {
  const { id, collectionSlug, globalSlug } = useDocumentInfo();
  const { submit } = useForm();
  const router = useRouter();
  const list = collectionSlug ? `/admin/collections/${collectionSlug}` : "/admin";

  // After "Create & create another" Payload opens the new record; go on to a fresh form.
  useEffect(() => {
    if (!id || !collectionSlug) return;
    try {
      const [slug, at] = (sessionStorage.getItem(AGAIN) ?? "").split("|");
      // Only right after the click, so a failed save never sends a later one on.
      if (slug === collectionSlug && Date.now() - Number(at) < 30_000) {
        sessionStorage.removeItem(AGAIN);
        router.push(`${list}/create`);
      }
    } catch {
      // Storage may be blocked; the plain create flow still works.
    }
  }, [id, collectionSlug, list, router]);

  const save = () => void submit();

  if (globalSlug) {
    return (
      <div className="form-actions">
        <button type="button" className="fi-btn fi-btn--primary" onClick={save}>
          Save
        </button>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="form-actions">
        <button type="button" className="fi-btn fi-btn--primary" onClick={save}>
          Create
        </button>
        <button
          type="button"
          className="fi-btn"
          onClick={() => {
            try {
              sessionStorage.setItem(AGAIN, `${collectionSlug}|${Date.now()}`);
            } catch {
              // See above.
            }
            save();
          }}
        >
          Create &amp; create another
        </button>
        <Link href={list} className="fi-btn">
          Cancel
        </Link>
      </div>
    );
  }

  return (
    <div className="form-actions">
      <button type="button" className="fi-btn fi-btn--primary" onClick={save}>
        Save changes
      </button>
      <Link href={list} className="fi-btn">
        Cancel
      </Link>
    </div>
  );
}
