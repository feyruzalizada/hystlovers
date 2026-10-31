import type { DocumentViewServerProps } from "payload";
import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { adminLabel, ORDER_STATUSES, PAYMENT_STATUSES } from "@/collections/Commerce";
import { PageHeader } from "./PageHeader";
import { DeleteRecord, EditRecord, PanelAccess, UpdateStatus } from "./ViewActions";

// The source panel's read-only view pages (Filament infolists) for orders,
// customers and contact messages.

const money = new Intl.NumberFormat("en", { style: "currency", currency: "AZN" });
const dateTime = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const when = (value: unknown) =>
  value ? dateTime.format(new Date(String(value))).replace(/, (\d\d:\d\d)$/, " $1") : "—";

type Tone = "gray" | "warning" | "info" | "success" | "danger";

const Badge = ({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) => (
  <span className={`fi-badge${tone === "gray" ? "" : ` fi-badge--${tone}`}`}>{children}</span>
);

const Entry = ({ label, children, span }: { label: string; children: ReactNode; span?: number }) => (
  <div className="fi-entry" style={span ? ({ "--span": span } as React.CSSProperties) : undefined}>
    <dt>{label}</dt>
    <dd>{children === null || children === undefined || children === "" ? "—" : children}</dd>
  </div>
);

const Section = ({ title, children }: { title?: string; children: ReactNode }) => (
  <section className="fi-section">
    {title && <header className="fi-section__header">{title}</header>}
    <div className="fi-section__content">{children}</div>
  </section>
);

const Grid = ({ columns, children }: { columns: number; children: ReactNode }) => (
  <dl className="fi-grid" style={{ "--cols": columns } as React.CSSProperties}>
    {children}
  </dl>
);

const statusTone = (status: string): Tone =>
  status === "pending"
    ? "warning"
    : status === "confirmed" || status === "shipped"
      ? "info"
      : status === "delivered"
        ? "success"
        : status === "cancelled"
          ? "danger"
          : "gray";

const options = (values: readonly string[]) => values.map((value) => ({ value, label: adminLabel(value) }));

const Page = ({ crumbs, title, actions, children }: Parameters<typeof PageHeader>[0] & { children: ReactNode }) => (
  <Gutter className="record-view">
    <PageHeader crumbs={crumbs} title={title} actions={actions} />
    {children}
  </Gutter>
);

type Order = {
  id: number;
  number: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  city: string;
  address: string;
  note?: string | null;
  items?: { name: string; colorName: string; size: string; qty: number; lineTotal: number }[];
  subtotal: number;
  shippingTotal: number;
  total: number;
};

export function orders({ doc }: DocumentViewServerProps) {
  const order = doc as Order;
  const base = `/admin/collections/orders/${order.id}`;
  return (
    <Page
      crumbs={[{ label: "Orders", href: "/admin/collections/orders" }, { label: order.number, href: `${base}/view` }, { label: "View" }]}
      title={`View ${order.number}`}
      actions={
        <>
          <EditRecord href={base} />
          <UpdateStatus
            id={order.id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            statuses={options(ORDER_STATUSES)}
            paymentStatuses={options(PAYMENT_STATUSES)}
          />
        </>
      }
    >
      <Section title="Order">
        <Grid columns={4}>
          <Entry label="Number">{order.number}</Entry>
          <Entry label="Status">
            <Badge tone={statusTone(order.status)}>{adminLabel(order.status)}</Badge>
          </Entry>
          <Entry label="Payment">
            <Badge>{adminLabel(order.paymentMethod)}</Badge>
          </Entry>
          <Entry label="Payment status">
            <Badge tone={order.paymentStatus === "paid" ? "success" : "warning"}>{adminLabel(order.paymentStatus)}</Badge>
          </Entry>
          <Entry label="Placed">{when(order.createdAt)}</Entry>
        </Grid>
      </Section>
      <Section title="Customer">
        <Grid columns={3}>
          <Entry label="Customer name">{order.customerName}</Entry>
          <Entry label="Customer email">
            <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
          </Entry>
          <Entry label="Phone">{order.phone}</Entry>
        </Grid>
        <Grid columns={2}>
          <Entry label="City">{order.city}</Entry>
          <Entry label="Address">{order.address}</Entry>
        </Grid>
        <Grid columns={1}>
          <Entry label="Note">{order.note}</Entry>
        </Grid>
      </Section>
      <Section title="Items">
        {(order.items ?? []).map((item, index) => (
          <div key={index} className="fi-repeat">
            <Grid columns={5}>
              <Entry label="Name" span={2}>
                {item.name}
              </Entry>
              <Entry label="Color">{item.colorName}</Entry>
              <Entry label="Size × qty">
                {item.size} × {item.qty}
              </Entry>
              <Entry label="Total">{money.format(Number(item.lineTotal))}</Entry>
            </Grid>
          </div>
        ))}
        <Grid columns={3}>
          <Entry label="Subtotal">{money.format(Number(order.subtotal))}</Entry>
          <Entry label="Shipping">{money.format(Number(order.shippingTotal))}</Entry>
          <Entry label="Total">
            <strong>{money.format(Number(order.total))}</strong>
          </Entry>
        </Grid>
      </Section>
    </Page>
  );
}

export async function customers({ doc, payload, initPageResult }: DocumentViewServerProps) {
  const customer = doc as { id: number; name: string; email: string; createdAt: string; panelAccess?: boolean };
  const base = `/admin/collections/customers/${customer.id}`;
  const { docs: orders } = await payload.find({
    collection: "orders",
    where: { customer: { equals: customer.id } },
    sort: "-createdAt",
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  // Your own access can't be revoked from here, as in the source panel.
  const isSelf = (initPageResult.req.user as { email?: string } | null)?.email === customer.email;

  return (
    <Page
      crumbs={[
        { label: "Customers", href: "/admin/collections/customers" },
        { label: customer.name, href: `${base}/view` },
        { label: "View" },
      ]}
      title={`View ${customer.name}`}
      actions={
        <>
          <EditRecord href={base} />
          {!isSelf && <PanelAccess id={customer.id} granted={Boolean(customer.panelAccess)} />}
        </>
      }
    >
      <Section title="Customer">
        <Grid columns={4}>
          <Entry label="Name">{customer.name}</Entry>
          <Entry label="Email">
            <a href={`mailto:${customer.email}`}>{customer.email}</a>
          </Entry>
          <Entry label="Registered">{when(customer.createdAt)}</Entry>
          <Entry label="Panel access">
            <Badge tone={customer.panelAccess ? "warning" : "gray"}>{customer.panelAccess ? "Admin" : "Customer"}</Badge>
          </Entry>
        </Grid>
      </Section>
      <Section title="Orders">
        {orders.length === 0 ? (
          <p className="fi-placeholder">This customer has not ordered yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="fi-repeat">
              <Grid columns={4}>
                <Entry label="Number">
                  <Link href={`/admin/collections/orders/${order.id}/view`}>{order.number}</Link>
                </Entry>
                <Entry label="Status">
                  {/* The source left this badge in the primary colour. */}
                  <Badge tone="warning">{adminLabel(order.status)}</Badge>
                </Entry>
                <Entry label="Total">{money.format(Number(order.total))}</Entry>
                <Entry label="Placed">{when(order.createdAt)}</Entry>
              </Grid>
            </div>
          ))
        )}
      </Section>
    </Page>
  );
}

export function contact_messages({ doc }: DocumentViewServerProps) {
  const message = doc as { id: number; name: string; email: string; createdAt: string; subject: string; message: string };
  return (
    <Page
      crumbs={[
        { label: "Contact Messages", href: "/admin/collections/contact-messages" },
        { label: adminLabel(message.subject) },
        { label: "View" },
      ]}
      title={`View ${adminLabel(message.subject)}`}
      actions={<DeleteRecord collection="contact-messages" id={message.id} />}
    >
      <Section>
        <Grid columns={3}>
          <Entry label="Name">{message.name}</Entry>
          <Entry label="Email">
            <a href={`mailto:${message.email}`}>{message.email}</a>
          </Entry>
          <Entry label="Received">{when(message.createdAt)}</Entry>
        </Grid>
        <Grid columns={1}>
          <Entry label="Subject">
            <Badge>{adminLabel(message.subject)}</Badge>
          </Entry>
          <Entry label="Message">
            <p className="fi-prose">{message.message}</p>
          </Entry>
        </Grid>
      </Section>
    </Page>
  );
}
