"use client";

import { useAuth } from "@payloadcms/ui";

/** The signed-in user's initial on a dark circle, as the source panel's avatar. */
export default function Avatar() {
  const { user } = useAuth<{ name?: string; email?: string }>();
  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <span className="fi-avatar" aria-hidden>
      {initial}
    </span>
  );
}
