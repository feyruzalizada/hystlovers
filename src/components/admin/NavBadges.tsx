"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Counts = Record<string, number>;

const REFRESH_MS = 60_000;

/**
 * Counts next to Orders (pending) and Contact messages (unread), as the
 * source panel's navigation badges showed. Payload's nav has no badge slot,
 * so the count is set on its link, whose id is stable (`nav-<slug>`).
 */
export default function NavBadges() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const response = await fetch("/api/nav-badges", { credentials: "include" }).catch(() => null);
      if (!response?.ok || cancelled) return;
      const counts = (await response.json()) as Counts;
      for (const [slug, count] of Object.entries(counts)) {
        const link = document.getElementById(`nav-${slug}`);
        if (!link) continue;
        if (count > 0) link.setAttribute("data-badge", String(count));
        else link.removeAttribute("data-badge");
      }
    };

    void refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pathname]);

  return null;
}
