"use client";

import { toast, useConfig, useListDrawerContext, useListQuery, useSelection, useTableColumns } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import type { Where } from "payload";
import * as qs from "qs-esm";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import type { Filter } from "./list-filters";
import { ConfirmModal, Dropdown } from "./Popover";

export type Toolbar = {
  reorder?: boolean;
  select?: boolean;
  columns?: boolean;
  /** Columns whose heading sorts, as in the source table; the others show no arrows. */
  sortable?: string[];
};

// The URL turns every value into a string, so options are compared in that form.
const normalize = (where: Where) => JSON.stringify(qs.parse(qs.stringify(where)));

// The panel's own filter builder nests conditions as or[0].and; both shapes are read.
const conditions = (where: Where | undefined): Where[] => {
  if (!where) return [];
  if (Array.isArray(where.and)) return where.and;
  if (Array.isArray(where.or) && where.or.length === 1 && Array.isArray(where.or[0]?.and)) return where.or[0].and as Where[];
  return [where];
};

const LOCKED_COLUMNS = new Set(["_select", "_dragHandle", "rowActions", "formActions"]);

/** CSS for what this list hides: arrows on unsorted columns, checkboxes, drag handles outside reorder mode. */
function listStyle(slug: string, toolbar: Toolbar, reordering: boolean) {
  const list = `.collection-list--${slug}:has(.fi-toolbar)`;
  const rules: string[] = [];
  const sortable = new Set([...(toolbar.sortable ?? []), "_dragHandle"]);
  rules.push(
    `${list} th:not(${[...sortable].map((name) => `#heading-${name}`).join(",")}) .sort-column__buttons{display:none}`,
  );
  if (!toolbar.select || reordering) rules.push(`${list} #heading-_select,${list} .cell-_select{display:none}`);
  if (!reordering) rules.push(`${list} #heading-_dragHandle,${list} .cell-_dragHandle{display:none}`);
  else rules.push(`${list} #heading-rowActions,${list} .cell-rowActions{visibility:hidden}`);
  return rules.join("\n");
}

export default function ListToolbarClient({ slug, filters, toolbar }: { slug: string; filters: Filter[]; toolbar: Toolbar }) {
  const { isInDrawer } = useListDrawerContext();
  if (isInDrawer) return null;
  return <Toolbar slug={slug} filters={filters} toolbar={toolbar} />;
}

function Toolbar({ slug, filters, toolbar }: { slug: string; filters: Filter[]; toolbar: Toolbar }) {
  const { query, refineListData, handleSearchChange } = useListQuery();
  const [reordering, setReordering] = useState(false);
  const sortBeforeReorder = useRef<string | undefined>(undefined);

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
      <style>{listStyle(slug, toolbar, reordering)}</style>
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
          {!reordering && toolbar.select && <BulkActions slug={slug} />}
        </div>
        {!reordering && (
          <div className="fi-toolbar__end">
            <Search initial={typeof query.search === "string" ? query.search : ""} onSearch={handleSearchChange} />
            {filters.length > 0 && <Filters filters={filters} />}
            {toolbar.columns && <Columns />}
          </div>
        )}
      </div>
      {reordering ? (
        <div className="fi-toolbar__note">Drag and drop the records into order.</div>
      ) : (
        toolbar.select && <SelectionBar />
      )}
    </div>
  );
}

function Search({ initial, onSearch }: { initial: string; onSearch?: (search: string) => Promise<void> }) {
  const [value, setValue] = useState(initial);
  const first = useRef(true);

  // Searches as you type, half a second after the last key, as the source table did.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => void onSearch?.(value.trim()), 500);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <label className="fi-input fi-input--search">
      <Icon name="search" />
      <input type="search" placeholder="Search" value={value} onChange={(event) => setValue(event.target.value)} />
    </label>
  );
}

function Filters({ filters }: { filters: Filter[] }) {
  const { query, refineListData } = useListQuery();
  const current = conditions(query.where as Where | undefined);
  const currentKeys = current.map(normalize);
  const applied = filters.map((filter) => filter.options.findIndex((option) => currentKeys.includes(normalize(option.where))));
  const [draft, setDraft] = useState(applied);
  const active = applied.filter((index) => index >= 0).length;

  const apply = (selection: number[]) => {
    const own = new Set(filters.flatMap((filter) => filter.options.map((option) => normalize(option.where))));
    const kept = current.filter((condition) => !own.has(normalize(condition)));
    const chosen = selection.flatMap((index, at) => (index >= 0 ? [filters[at].options[index].where] : []));
    const next = [...kept, ...chosen];
    void refineListData({ where: next.length > 0 ? { and: next } : undefined, page: 1 });
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
                const none = filters.map(() => -1);
                setDraft(none);
                apply(none);
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
                  onChange={(event) => setDraft(draft.map((value, i) => (i === at ? (event.target.checked ? 0 : -1) : value)))}
                />
                <span>{filter.label}</span>
              </label>
            ) : (
              <label key={filter.label} className="fi-field">
                <span className="fi-field__label">{filter.label}</span>
                <span className="fi-select">
                  <select
                    value={draft[at]}
                    onChange={(event) => setDraft(draft.map((value, i) => (i === at ? Number(event.target.value) : value)))}
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
          <div>
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
                    event.target.checked ? [...draft, column.accessor] : draft.filter((name) => name !== column.accessor),
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
                // Locked columns keep their place: the checkbox, the drag handle and the row actions.
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

function BulkActions({ slug }: { slug: string }) {
  const { count, getQueryParams, toggleAll } = useSelection();
  const { refineListData } = useListQuery();
  const { config } = useConfig();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (count === 0) return null;

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${config.serverURL}${config.routes.api}/${slug}${getQueryParams()}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Accept-Language": "en" },
      });
      const body = (await res.json().catch(() => ({}))) as { errors?: { message: string }[] };
      if (!res.ok || body.errors?.length) {
        toast.error(body.errors?.[0]?.message ?? "Could not delete the selected records.");
      } else {
        toast.success("Deleted");
        toggleAll();
        await refineListData({ page: 1 });
        router.refresh();
      }
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <Dropdown
        align="start"
        trigger={
          <span className="fi-btn fi-btn--outline">
            <Icon name="dots" />
            Bulk actions
          </span>
        }
      >
        {(close) => (
          <div className="fi-menu">
            <button
              type="button"
              className="fi-menu__item fi-menu__item--danger"
              onClick={() => {
                close();
                setConfirming(true);
              }}
            >
              <Icon name="trash" />
              Delete selected
            </button>
          </div>
        )}
      </Dropdown>
      {confirming && (
        <ConfirmModal
          title="Delete selected"
          busy={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void remove()}
        />
      )}
    </>
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
