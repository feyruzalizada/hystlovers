import crypto from "node:crypto";
import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeChangeHook,
  type PayloadRequest,
} from "payload";

// Writes made here carry this flag so the opposite collection's hooks skip them.
const SYNC = "customerSync";

type CustomerRef = number | string | { id: number | string } | null | undefined;

async function recountOrders(req: PayloadRequest, customer: CustomerRef) {
  if (!customer) return;
  const id = typeof customer === "object" ? customer.id : customer;
  const { totalDocs } = await req.payload.count({
    collection: "orders",
    where: { customer: { equals: id } },
    overrideAccess: true,
    req,
  });
  await req.payload.update({
    collection: "customers",
    id,
    data: { ordersCount: totalDocs },
    overrideAccess: true,
    req,
    context: { [SYNC]: true },
  });
}

/** Keeps `customers.ordersCount` stored, so the list can sort and filter on it. */
export const countOrdersAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation === "create") await recountOrders(req, doc.customer);
  else if (previousDoc?.customer !== doc.customer) {
    await recountOrders(req, previousDoc?.customer);
    await recountOrders(req, doc.customer);
  }
  return doc;
};

export const countOrdersAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await recountOrders(req, doc.customer);
  return doc;
};

/** Removing your own access would lock you out of the panel you are using. */
export const guardOwnPanelAccess: CollectionBeforeChangeHook = ({ data, originalDoc, req, operation, context }) => {
  if (
    !context[SYNC] &&
    operation === "update" &&
    originalDoc?.panelAccess &&
    data.panelAccess === false &&
    req.user?.collection === "users" &&
    req.user.email === originalDoc.email
  ) {
    throw new APIError("You cannot revoke your own panel access.", 400, undefined, true);
  }
  return data;
};

/**
 * The source's is_admin flag: granting access gives the customer an admin
 * account under the same email that starts with the same password; revoking
 * deletes that account.
 */
export const syncPanelAccount: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, context }) => {
  if (context[SYNC] || operation !== "update" || Boolean(doc.panelAccess) === Boolean(previousDoc?.panelAccess)) {
    return doc;
  }

  const {
    docs: [account],
  } = await req.payload.find({
    collection: "users",
    where: { email: { equals: doc.email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });

  if (doc.panelAccess && !account) {
    const created = await req.payload.create({
      collection: "users",
      data: { name: doc.name, email: doc.email, password: crypto.randomBytes(32).toString("hex") },
      overrideAccess: true,
      req,
      context: { [SYNC]: true },
    });
    const source = (await req.payload.db.findOne({
      collection: "customers",
      where: { id: { equals: doc.id } },
      req,
    })) as { hash?: string; salt?: string } | null;
    if (source?.hash && source.salt) {
      await req.payload.db.updateOne({
        collection: "users",
        id: created.id,
        data: { hash: source.hash, salt: source.salt },
        req,
      });
    }
  }

  if (!doc.panelAccess && account) {
    await req.payload.delete({ collection: "users", id: account.id, overrideAccess: true, req, context: { [SYNC]: true } });
  }

  return doc;
};

async function markCustomer(req: PayloadRequest, email: string, panelAccess: boolean) {
  await req.payload.update({
    collection: "customers",
    where: { email: { equals: email } },
    data: { panelAccess },
    overrideAccess: true,
    req,
    context: { [SYNC]: true },
  });
}

/** Admins added or removed under Users show up on the matching customer too. */
export const markCustomerAfterUserChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, context }) => {
  if (context[SYNC]) return doc;
  if (operation === "create") await markCustomer(req, doc.email, true);
  else if (previousDoc?.email && previousDoc.email !== doc.email) {
    await markCustomer(req, previousDoc.email, false);
    await markCustomer(req, doc.email, true);
  }
  return doc;
};

export const markCustomerAfterUserDelete: CollectionAfterDeleteHook = async ({ doc, req, context }) => {
  if (!context[SYNC]) await markCustomer(req, doc.email, false);
  return doc;
};
