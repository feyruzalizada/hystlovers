"use client";

import { Button, useListQuery } from "@payloadcms/ui";
import type { Where } from "payload";
import * as qs from "qs-esm";
import type { Filter } from "./list-filters";

// The URL turns every value into a string, so options are compared in that form.
const normalize = (where: Where) => JSON.stringify(qs.parse(qs.stringify(where)));

// The panel's own filter builder nests conditions as or[0].and; both shapes are read.
const conditions = (where: Where | undefined): Where[] => {
  if (!where) return [];
  if (Array.isArray(where.and)) return where.and;
  if (Array.isArray(where.or) && where.or.length === 1 && Array.isArray(where.or[0]?.and)) return where.or[0].and as Where[];
  return [where];
};

export default function ListFiltersClient({ filters, exportPath }: { filters: Filter[]; exportPath?: string }) {
  const { query, refineListData } = useListQuery();
  const current = conditions(query.where as Where | undefined);
  const currentKeys = current.map(normalize);

  const selectedIndex = (filter: Filter) =>
    filter.options.findIndex((option) => currentKeys.includes(normalize(option.where)));

  const select = (filter: Filter, index: number) => {
    const own = new Set(filter.options.map((option) => normalize(option.where)));
    const kept = current.filter((condition) => !own.has(normalize(condition)));
    const next = index >= 0 ? [...kept, filter.options[index].where] : kept;
    void refineListData({ where: next.length > 0 ? { and: next } : undefined, page: 1 });
  };

  return (
    <div className="list-filters">
      {filters.map((filter) => (
        <label key={filter.label} className="list-filters__item">
          <span>{filter.label}</span>
          <select value={selectedIndex(filter)} onChange={(event) => select(filter, Number(event.target.value))}>
            <option value={-1}>All</option>
            {filter.options.map((option, index) => (
              <option key={option.label} value={index}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {exportPath && (
        // Exports what the list shows: the same filters and search.
        <Button
          className="list-filters__export"
          buttonStyle="secondary"
          size="small"
          el="anchor"
          url={`${exportPath}${qs.stringify({ where: query.where, search: query.search }, { addQueryPrefix: true })}`}
        >
          Export CSV
        </Button>
      )}
    </div>
  );
}
