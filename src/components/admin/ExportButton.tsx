"use client";

import { useListQuery } from "@payloadcms/ui";
import * as qs from "qs-esm";
import { Icon } from "./icons";

/** "Export CSV" in the page header; exports what the list shows, filters and search included. */
export default function ExportButton({ path }: { path: string }) {
  const { query } = useListQuery();
  return (
    <a className="fi-btn fi-btn--outline" href={`${path}${qs.stringify({ where: query.where, search: query.search }, { addQueryPrefix: true })}`}>
      <Icon name="download" />
      Export CSV
    </a>
  );
}
