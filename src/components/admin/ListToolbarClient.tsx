"use client";

import {
  DeleteMany,
  EditMany,
  useConfig,
  useListDrawerContext,
  useListQuery,
  useSelection,
  useTableColumns,
} from "@payloadcms/ui";
import type { Where } from "payload";
import * as qs from "qs-esm";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import type { Filter } from "./list-filters";
import { Dropdown } from "./Popover";

export type Toolbar = {
  /** The collection can be put in order by dragging, as Payload's orderable lists. */
  reorder?: boolean;
};

// The URL turns every value into a string, so options are compared in that form.
const normalize = (where: Where) => JSON.stringify(qs.parse(qs.stringify(where)));

// The panel's own filter builder nests conditions as or[0].and; both shapes are read.
const conditions = (where: Where | undefined): Where[] => {
  if (!where) return [];
  if (Array.isArray(where.and)) return where.and;
  if (Array.isArray(where.or) && where.or.length === 1 && Array.isArray(where.or[0]?.and))
    return where.or[0].and as Where[];
  return [where];
};

const LOCKED_COLUMNS = new Set(["_select", "_dragHandle", "rowActions", "formActions"]);

/** Drag handles show only in reorder mode, as the source; checkboxes and row actions step aside then. */
function listStyle(slug: string, reordering: boolean) {
  const list = `.collection-list--${slug}:has(.fi-toolbar)`;
  return reordering
    ? `${list} #heading-_select,${list} .cell-_select{display:none}\n${list} #heading-rowActions,${list} .cell-rowActions{visibility:hidden}`
    : `${list} #heading-_dragHandle,${list} .cell-_dragHandle{display:none}`;
}

export default function ListToolbarClient({
  slug,
  filters,
  toolbar,
}: {
  slug: string;
  filters: Filter[];
  toolbar: Toolbar;
}) {
  const { isInDrawer } = useListDrawerContext();
  if (isInDrawer) return null;
  return <Toolbar slug={slug} filters={filters} toolbar={toolbar} />;
}

function Toolbar({ slug, filters, toolbar }: { slug: string; filters: Filter[]; toolbar: Toolbar }) {
  const { query, refineListData, handleSearchChange } = useListQuery();
  const [reordering, setReordering] = useState(false);
  const sortBeforeReorder = useRef<string | undefined>(undefined);

  // Payload lets rows be dragged only while the list is sorted by its order.
  const toggleReorder = () => {
    if (!reordering) {
      sortBeforeReorder.current = typeof query.sort === "string" ? query.sort : undefined;
      void refineListData({ sort: "_order", page: 1 });
    } else {
      void refineListData({ sort: sortBeforeReorder.current ?? "_order" });
    }
    setReordering(!reordering);
  };

  return (
    <div className="fi-toolbar">
      <style>{listStyle(slug, reordering)}</style>
      <div className="fi-toolbar__bar">
        <div className="fi-toolbar__start">
          {toolbar.reorder && (
            <button
              type="button"
              className="fi-icon-btn"
              title={reordering ? "Finish reordering records" : "Reorder records"}
              aria-label={reordering ? "Finish reordering records" : "Reorder records"}
              onClick={toggleReorder}
            >
              <Icon name={reordering ? "done" : "reorder"} />
            </button>
          )}
          {!reordering && <BulkActions slug={slug} />}
        </div>
        {!reordering && (
          <div className="fi-toolbar__end">
            <Search initial={typeof query.search === "string" ? query.search : ""} onSearch={handleSearchChange} />
            <Filters filters={filters} />
            <Columns />
          </div>
        )}
      </div>
      {reordering ? <div className="fi-toolbar__note">Drag and drop the records into order.</div> : <SelectionBar />}
    </div>
  );
}

function Search({ initial, onSearch }: { initial: string; onSearch?: (search: string) => Promise<void> }) {
  const [value, setValue] = useState(initial);
  const searched = useRef(initial.trim());
  const latest = useRef(onSearch);
  latest.current = onSearch;

  // Searches as you type, half a second after the last key, as the source table did.
  // Only a changed term searches: a new search reloads the list and clears the selection.
  useEffect(() => {
    const term = value.trim();
    if (term === searched.current) return;
    const timer = setTimeout(() => {
      searched.current = term;
      void latest.current?.(term);
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <label className="fi-input fi-input--search">
      <Icon name="search" />
      <input type="search" placeholder="Search" value={value} onChange={(event) => setValue(event.target.value)} />
    </label>
  );
}

/** Payload's own condition builder stays under the toolbar; this opens and closes it. */
const toggleAdvanced = () => document.querySelector<HTMLButtonElement>(".list-controls__toggle-where")?.click();

function Filters({ filters }: { filters: Filter[] }) {
  const { query, refineListData } = useListQuery();
  const current = conditions(query.where as Where | undefined);
  const currentKeys = current.map(normalize);
  const applied = filters.map((filter) =>
    filter.options.findIndex((option) => currentKeys.includes(normalize(option.where))),
  );
  const [draft, setDraft] = useState(applied);
  const own = new Set(filters.flatMap((filter) => filter.options.map((option) => normalize(option.where))));
  // Conditions from the advanced builder count too.
  const active = applied.filter((index) => index >= 0).length + current.filter((c) => !own.has(normalize(c))).length;

  const apply = (selection: number[]) => {
    const kept = current.filter((condition) => !own.has(normalize(condition)));
    const chosen = selection.flatMap((index, at) => (index >= 0 ? [filters[at].options[index].where] : []));
    const next = [...kept, ...chosen];
    void refineListData({
      where: next.length > 0 ? { and: next } : undefined,
      page: 1,
    });
  };

  return (
    <Dropdown
      className="fi-filters"
      onOpen={() => setDraft(applied)}
      trigger={
        <span className="fi-icon-btn fi-icon-btn--badged" title="Filter" aria-label="Filter">
          <Icon name="funnel" />
          <span className="fi-icon-btn__badge">{active}</span>
        </span>
      }
    >
      {(close) => (
        <div className="fi-panel">
          <div className="fi-panel__head">
            <h4>Filters</h4>
            <button
              type="button"
              className="fi-link fi-link--danger"
              onClick={() => {
                setDraft(filters.map(() => -1));
                void refineListData({ where: undefined, page: 1 });
              }}
            >
              Reset
            </button>
          </div>
          {filters.map((filter, at) =>
            filter.toggle ? (
              <label key={filter.label} className="fi-check">
                <input
                  type="checkbox"
                  checked={draft[at] === 0}
                  onChange={(event) =>
                    setDraft(draft.map((value, i) => (i === at ? (event.target.checked ? 0 : -1) : value)))
                  }
                />
                <span>{filter.label}</span>
              </label>
            ) : (
              <label key={filter.label} className="fi-field">
                <span className="fi-field__label">{filter.label}</span>
                <span className="fi-select">
                  <select
                    value={draft[at]}
                    onChange={(event) =>
                      setDraft(draft.map((value, i) => (i === at ? Number(event.target.value) : value)))
                    }
                  >
                    <option value={-1}>{filter.blank ?? "All"}</option>
                    {filter.options.map((option, index) => (
                      <option key={option.label} value={index}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevronDown" />
                </span>
              </label>
            ),
          )}
          <div className="fi-panel__actions">
            {filters.length > 0 && (
              <button
                type="button"
                className="fi-btn fi-btn--primary"
                onClick={() => {
                  apply(draft);
                  close();
                }}
              >
                Apply filters
              </button>
            )}
            <button
              type="button"
              className="fi-link"
              onClick={() => {
                toggleAdvanced();
                close();
              }}
            >
              Advanced filters
            </button>
          </div>
        </div>
      )}
    </Dropdown>
  );
}

function Columns() {
  const { columns, setActiveColumns, resetColumnsState } = useTableColumns();
  const toggleable = columns.filter((column) => !LOCKED_COLUMNS.has(column.accessor));
  const activeNow = () => toggleable.filter((column) => column.active).map((column) => column.accessor);
  const [draft, setDraft] = useState<string[]>(activeNow);

  const label = (column: (typeof columns)[number]) => {
    const field = column.field as { label?: unknown; name?: string };
    return typeof field.label === "string" ? field.label : (field.name ?? column.accessor);
  };

  return (
    <Dropdown
      className="fi-columns"
      onOpen={() => setDraft(activeNow())}
      trigger={
        <span className="fi-icon-btn" title="Column manager" aria-label="Column manager">
          <Icon name="columns" />
        </span>
      }
    >
      {(close) => (
        <div className="fi-panel">
          <div className="fi-panel__head">
            <h4>Columns</h4>
            <button
              type="button"
              className="fi-link fi-link--danger"
              onClick={() => {
                void resetColumnsState();
                close();
              }}
            >
              Reset
            </button>
          </div>
          {toggleable.map((column) => (
            <label key={column.accessor} className="fi-check">
              <input
                type="checkbox"
                checked={draft.includes(column.accessor)}
                onChange={(event) =>
                  setDraft(
                    event.target.checked
                      ? [...draft, column.accessor]
                      : draft.filter((name) => name !== column.accessor),
                  )
                }
              />
              <span>{label(column)}</span>
            </label>
          ))}
          <div>
            <button
              type="button"
              className="fi-btn fi-btn--primary"
              onClick={() => {
                // The checkbox, drag handle and row action columns keep their place.
                const locked = columns.filter((column) => LOCKED_COLUMNS.has(column.accessor) && column.active);
                void setActiveColumns([
                  ...locked.filter((column) => column.accessor !== "rowActions").map((column) => column.accessor),
                  ...toggleable.filter((column) => draft.includes(column.accessor)).map((column) => column.accessor),
                  ...locked.filter((column) => column.accessor === "rowActions").map((column) => column.accessor),
                ]);
                close();
              }}
            >
              Apply columns
            </button>
          </div>
        </div>
      )}
    </Dropdown>
  );
}

/** Payload's own bulk Edit and Delete, offered from the source's "Bulk actions" menu. */
function BulkActions({ slug }: { slug: string }) {
  const { count } = useSelection();
  const { getEntityConfig } = useConfig();
  const collection = getEntityConfig({ collectionSlug: slug });
  if (count === 0 || !collection) return null;

  return (
    <Dropdown
      align="start"
      keepMounted
      className="fi-bulk"
      trigger={
        <span className="fi-btn fi-btn--outline">
          <Icon name="dots" />
          Bulk actions
        </span>
      }
    >
      {() => (
        <div className="fi-menu">
          <EditMany collection={collection} />
          <DeleteMany collection={collection} />
        </div>
      )}
    </Dropdown>
  );
}

function SelectionBar() {
  const { count, totalDocs, selectAll, toggleAll } = useSelection();
  if (count === 0) return null;
  const everything = selectAll === "allAvailable";
  const shown = everything ? totalDocs : count;

  return (
    <div className="fi-toolbar__note fi-toolbar__note--selection">
      <span>
        {shown} {shown === 1 ? "record" : "records"} selected
      </span>
      <span className="fi-toolbar__note-actions">
        {!everything && count < totalDocs && (
          <button type="button" className="fi-link" onClick={() => toggleAll(true)}>
            Select all {totalDocs}
          </button>
        )}
        <button type="button" className="fi-link fi-link--danger" onClick={() => toggleAll()}>
          Deselect all
        </button>
      </span>
    </div>
  );
}
