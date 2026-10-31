import type { BeforeListServerProps } from "payload";
import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import { PageHeader } from "./PageHeader";

type Panel = { title?: string; singular?: string };

/** "Products › List", the title and "New product", as the source list pages opened. */
export default function ListHeading({ collectionConfig, hasCreatePermission, newDocumentURL }: BeforeListServerProps) {
  const panel = (collectionConfig.admin.custom?.panel ?? {}) as Panel;
  const title = panel.title ?? String(collectionConfig.labels.plural);
  const url = `/admin/collections/${collectionConfig.slug}`;

  return (
    <Gutter className="list-heading">
      <PageHeader
        crumbs={[{ label: title, href: url }, { label: "List" }]}
        title={title}
        actions={
          hasCreatePermission && panel.singular ? (
            <Link href={newDocumentURL} className="fi-btn fi-btn--primary">
              New {panel.singular.toLowerCase()}
            </Link>
          ) : undefined
        }
      />
    </Gutter>
  );
}
