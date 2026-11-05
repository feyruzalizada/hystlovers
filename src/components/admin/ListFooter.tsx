"use client";

import { useListDrawerContext, useListQuery } from "@payloadcms/ui";
import { Icon } from "./icons";

const PER_PAGE = [5, 10, 25, 50];

/** Pages to show around the current one, with gaps, as the source pager: 1 2 3 4 … 22 23. */
function pages(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const near = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  if (current <= 4) [3, 4].forEach((page) => near.add(page));
  if (current >= total - 3) [total - 3, total - 2].forEach((page) => near.add(page));
  const sorted = [...near].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) out.push("gap");
    out.push(page);
  });
  return out;
}

/** "Showing 1 to 10 of 39 results", the per-page choice and the pager under the source table. */
export default function ListFooter() {
  const { isInDrawer } = useListDrawerContext();
  const { data, handlePageChange, handlePerPageChange } = useListQuery();
  if (isInDrawer || !data || data.totalDocs === 0) return null;

  const { page = 1, limit, totalDocs, totalPages } = data;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalDocs);
  const options = PER_PAGE.includes(limit) ? PER_PAGE : [...PER_PAGE, limit].sort((a, b) => a - b);

  return (
    <div className="fi-pagination">
      <p className="fi-pagination__overview">
        Showing {from} to {to} of {totalDocs} results
      </p>
      <label className="fi-pagination__per-page">
        <span>Per page</span>
        <span className="fi-select">
          <select value={limit} onChange={(event) => void handlePerPageChange?.(Number(event.target.value))}>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" />
        </span>
      </label>
      {totalPages > 1 ? (
        <nav className="fi-pagination__pages" aria-label="Pagination">
          {page > 1 && (
            <button type="button" aria-label="Previous" onClick={() => void handlePageChange?.(page - 1)}>
              <Icon name="chevronLeft" />
            </button>
          )}
          {pages(page, totalPages).map((item, i) =>
            item === "gap" ? (
              <span key={`gap-${i}`} className="fi-pagination__gap">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === page ? "page" : undefined}
                className={item === page ? "is-active" : undefined}
                onClick={() => void handlePageChange?.(item)}
              >
                {item}
              </button>
            ),
          )}
          {page < totalPages && (
            <button type="button" aria-label="Next" onClick={() => void handlePageChange?.(page + 1)}>
              <Icon name="chevronRight" />
            </button>
          )}
        </nav>
      ) : (
        <span />
      )}
    </div>
  );
}
