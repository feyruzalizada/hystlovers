import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

/** The source panel's page header: breadcrumbs, the page title and its actions. */
export function PageHeader({ crumbs, title, actions }: { crumbs: Crumb[]; title: string; actions?: ReactNode }) {
  return (
    <div className="fi-header">
      <div className="fi-header__main">
        {crumbs.length > 0 && (
          <nav className="fi-breadcrumbs" aria-label="Breadcrumbs">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="fi-breadcrumbs__item">
                {index > 0 && (
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden width="20" height="20">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    />
                  </svg>
                )}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="fi-header__title">{title}</h1>
      </div>
      {actions && <div className="fi-header__actions">{actions}</div>}
    </div>
  );
}
