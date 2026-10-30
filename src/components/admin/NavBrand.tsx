"use client";

import { useNav } from "@payloadcms/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** The brand and the Dashboard entry at the top of the sidebar, as in the source panel. */
export default function NavBrand() {
  const pathname = usePathname();
  const onDashboard = pathname === "/admin" || pathname === "/admin/";
  const { hydrated, setNavOpen } = useNav();

  // Payload folds the sidebar away below 1440px; the source panel kept it from 1024px.
  // The delay lets Payload's own breakpoint check run first.
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      if (window.innerWidth >= 1024) setNavOpen(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [hydrated, setNavOpen]);

  return (
    <>
      <Link href="/admin" className="nav-brand">
        Hystlovers
      </Link>
      <Link href="/admin" id="nav-dashboard" className={`nav__link${onDashboard ? " nav__link--active" : ""}`}>
        <span className="nav__link-label">Dashboard</span>
      </Link>
    </>
  );
}
