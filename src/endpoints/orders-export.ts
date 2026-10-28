import type { Endpoint, Where } from "payload";
import { adminLabel } from "@/collections/Commerce";
import type { Order } from "@/payload-types";

const HEADER = [
  "Order", "Placed", "Status", "Payment method", "Payment status",
  "Customer", "Email", "Phone", "City", "Address", "Note",
  "Product", "Color", "Size", "Qty", "Pre-order", "Unit price", "Line total",
  "Subtotal", "Shipping", "Total", "Currency",
];

// Times are UTC, as the source app ran.
const stamp = (iso: string) => iso.slice(0, 16).replace("T", " ");

const cell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const rows = (order: Order) =>
  (order.items ?? []).map((item) => [
    order.number,
    stamp(order.createdAt),
    adminLabel(order.status),
    adminLabel(order.paymentMethod),
    adminLabel(order.paymentStatus),
    order.customerName,
    order.customerEmail,
    order.phone,
    order.city,
    order.address,
    order.note,
    item.name,
    item.colorName,
    item.size,
    item.qty,
    item.isPreorder ? "yes" : "no",
    item.unitPrice,
    item.lineTotal,
    order.subtotal,
    order.shippingTotal,
    order.total,
    order.currency,
  ]);

/**
 * One row per order line, so the file pivots in a spreadsheet. Takes the
 * list's own `where` and `search`, so it exports what the admin is looking at.
 */
export const ordersExport: Endpoint = {
  path: "/export",
  method: "get",
  handler: async (req) => {
    if (req.user?.collection !== "users") return Response.json({ error: "Unauthorized" }, { status: 401 });

    const constraints: Where[] = [];
    const where = req.query?.where as Where | undefined;
    if (where && typeof where === "object") constraints.push(where);
    const search = typeof req.query?.search === "string" ? req.query.search.trim() : "";
    if (search) {
      constraints.push({ or: [{ number: { like: search } }, { customerName: { like: search } }] });
    }

    const { docs } = await req.payload.find({
      collection: "orders",
      where: constraints.length > 0 ? { and: constraints } : undefined,
      sort: "createdAt",
      limit: 0,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    });

    const lines = [HEADER, ...docs.flatMap(rows)].map((row) => row.map(cell).join(","));
    // BOM so Excel opens Azerbaijani and Russian letters correctly.
    const body = `﻿${lines.join("\r\n")}\r\n`;
    const filename = `orders-${new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "")}.csv`;

    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=UTF-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  },
};
