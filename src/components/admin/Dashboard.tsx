import type { AdminViewServerProps } from "payload";
import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import DashboardStats from "./DashboardStats";
import { Icon } from "./icons";

/** The source panel's dashboard: a welcome card, then the shop's stats. */
export default function Dashboard({ initPageResult }: AdminViewServerProps) {
  const user = initPageResult.req.user as { name?: string; email?: string } | null;
  const name = user?.name || user?.email || "";

  return (
    <Gutter className="dashboard-view">
      <h1 className="dashboard__title">Dashboard</h1>
      <div className="dashboard-top">
        <section className="dashboard-welcome">
          <span className="fi-avatar fi-avatar--lg" aria-hidden>
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="dashboard-welcome__main">
            <h2 className="dashboard-welcome__heading">Welcome</h2>
            <p className="dashboard-welcome__name">{name}</p>
          </div>
          <Link href="/admin/logout" className="dashboard-welcome__logout">
            <Icon name="signOut" />
            Sign out
          </Link>
        </section>
      </div>
      <DashboardStats />
    </Gutter>
  );
}
