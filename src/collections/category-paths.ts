import type { Payload, PayloadRequest } from "payload";

type Node = { id: number | string; name?: string | null; parent?: number | string | null; pathName?: string | null };

async function allCategories(payload: Payload, req?: PayloadRequest): Promise<Node[]> {
  const { docs } = await payload.find({
    collection: "categories",
    locale: "az",
    depth: 0,
    limit: 0,
    pagination: false,
    select: { name: true, parent: true, pathName: true },
    overrideAccess: true,
    req,
  });
  return docs as unknown as Node[];
}

/**
 * "Parent › Child" in the default language, which is how the source panel
 * listed categories in every select. Stored so it can be the record title.
 */
export async function refreshCategoryPaths(payload: Payload, req?: PayloadRequest) {
  const nodes = await allCategories(payload, req);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const path = (node: Node, seen = new Set<Node["id"]>()): string => {
    const parent = node.parent ? byId.get(node.parent) : undefined;
    if (!parent || seen.has(node.id)) return node.name ?? "";
    seen.add(node.id);
    return `${path(parent, seen)} › ${node.name ?? ""}`;
  };
  for (const node of nodes) {
    const pathName = path(node);
    if (pathName === node.pathName) continue;
    await payload.db.updateOne({ collection: "categories", where: { id: { equals: node.id } }, data: { pathName }, req });
  }
}

/** A category and everything under it, which can never become its parent. */
export async function descendantIdsWithSelf(payload: Payload, id: number | string, req?: PayloadRequest) {
  const nodes = await allCategories(payload, req);
  const ids = new Set([id]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const node of nodes) {
      if (node.parent && ids.has(node.parent) && !ids.has(node.id)) {
        ids.add(node.id);
        grew = true;
      }
    }
  }
  return [...ids];
}
