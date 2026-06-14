import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "./lib/supabase";
import HomeSearch from "./components/HomeSearch";

type Profile = {
  full_name: string | null;
  email: string | null;
  workspaces: {
    name: string | null;
  } | null;
};

type Task = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
};

type HotOpportunity = {
  id: string;
  name: string;
  stage: string;
  lead_temperature: string;
  estimated_monthly_value: number | null;
  companies: {
    id: string;
    name: string;
  } | null;
};

type Activity = {
  id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  outcome: string | null;
};

type Note = {
  id: string;
  title: string;
  body: string | null;
  source: string | null;
  tags: string | null;
  created_at: string | null;
};

function getTodayString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function getDateOnly(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleString();
}

function cardStyle(): CSSProperties {
  return {
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "14px",
    backgroundColor: "#1a1a1a",
  };
}

function widgetStyle(): CSSProperties {
  return {
    ...cardStyle(),
    minHeight: "205px",
  };
}

function scrollAreaStyle(): CSSProperties {
  return {
    maxHeight: "116px",
    overflowY: "auto",
    paddingRight: "6px",
  };
}

function buttonStyle(): CSSProperties {
  return {
    display: "block",
    backgroundColor: "white",
    color: "black",
    padding: "10px 12px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "bold",
    textAlign: "center",
  };
}

function sidebarLinkStyle(): CSSProperties {
  return {
    display: "block",
    color: "white",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "6px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    marginBottom: "8px",
    fontWeight: "bold",
  };
}

function listLinkStyle(): CSSProperties {
  return {
    display: "block",
    color: "white",
    textDecoration: "none",
    marginBottom: "10px",
    lineHeight: "1.35",
  };
}

export default async function Home() {
  const today = getTodayString();

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(`
      full_name,
      email,
      workspaces (
        name
      )
    `)
    .limit(1);

  const profile = profiles?.[0] as Profile | undefined;
  const workspaceName = profile?.workspaces?.name ?? "No workspace found";
  const fullName = profile?.full_name ?? "No profile found";

  const { count: companyCount, error: companyCountError } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true });

  const { count: contactCount, error: contactCountError } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true });

  const { count: opportunityCount, error: opportunityCountError } =
    await supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true });

  const { data: taskRows, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date")
    .order("due_date", { ascending: true });

  const allTasks: Task[] = taskRows ?? [];

  const openTasks = allTasks.filter(
    (task) => task.status !== "Completed" && task.status !== "Cancelled"
  );

  const tasksDueToday = openTasks.filter(
    (task) => getDateOnly(task.due_date) === today
  );

  const overdueTasks = openTasks.filter((task) => {
    const taskDate = getDateOnly(task.due_date);
    return taskDate !== "" && taskDate < today;
  });

  const { data: hotOpportunityRows, error: hotOpportunityError } =
    await supabase
      .from("opportunities")
      .select(`
        id,
        name,
        stage,
        lead_temperature,
        estimated_monthly_value,
        companies (
          id,
          name
        )
      `)
      .eq("lead_temperature", "Hot")
      .order("updated_at", { ascending: false })
      .limit(10);

  const hotOpportunities: HotOpportunity[] = hotOpportunityRows ?? [];

  const { data: activityRows, error: activityError } = await supabase
    .from("activities")
    .select("id, activity_type, activity_date, subject, outcome")
    .order("activity_date", { ascending: false })
    .limit(10);

  const recentActivities: Activity[] = activityRows ?? [];

  const { data: noteRows, error: noteError } = await supabase
    .from("notes")
    .select("id, title, body, source, tags, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const recentNotes: Note[] = noteRows ?? [];

  const navigationLinks = [
    { title: "Companies", href: "/companies" },
    { title: "Contacts", href: "/contacts" },
    { title: "Opportunities", href: "/opportunities" },
    { title: "Tasks", href: "/tasks" },
    { title: "Activities", href: "/activities" },
    { title: "Notes", href: "/notes" },
  ];

  const quickAdds = [
    { title: "+ Company", href: "/companies/new" },
    { title: "+ Contact", href: "/contacts/new" },
    { title: "+ Opportunity", href: "/opportunities/new" },
    { title: "+ Task", href: "/tasks/new" },
    { title: "+ Activity", href: "/activities/new" },
    { title: "+ Note", href: "/notes/new" },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
          padding: "24px",
        }}
      >
        <aside
          style={{
            width: "220px",
            flexShrink: 0,
            position: "sticky",
            top: "24px",
            border: "1px solid #333",
            borderRadius: "12px",
            backgroundColor: "#151515",
            padding: "16px",
            maxHeight: "calc(100vh - 48px)",
            overflowY: "auto",
          }}
        >
          <p
            style={{
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontSize: "11px",
              margin: "0 0 8px 0",
            }}
          >
            Sell It
          </p>

          <h2 style={{ margin: "0 0 16px 0", fontSize: "24px" }}>CRM</h2>

          <p style={{ color: "#aaa", marginBottom: "8px", fontSize: "13px" }}>
            Navigate
          </p>

          {navigationLinks.map((item) => (
            <Link key={item.href} href={item.href} style={sidebarLinkStyle()}>
              {item.title}
            </Link>
          ))}

          <p
            style={{
              color: "#aaa",
              margin: "18px 0 8px 0",
              fontSize: "13px",
            }}
          >
            Quick Add
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {quickAdds.map((item) => (
              <Link key={item.href} href={item.href} style={buttonStyle()}>
                {item.title}
              </Link>
            ))}
          </div>
        </aside>

        <section
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: "1250px",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                color: "#aaa",
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "6px",
                fontSize: "13px",
              }}
            >
              Business Command Center
            </p>

            <h1 style={{ fontSize: "42px", margin: "0 0 8px 0" }}>SELL IT</h1>

            <p style={{ color: "#aaa", fontSize: "16px", lineHeight: "1.4" }}>
              Sales follow-ups, leads, contacts, tasks, opportunities, notes,
              and daily activity in one place.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div style={cardStyle()}>
              <p style={{ color: "#aaa", margin: "0 0 6px 0" }}>
                Connected Workspace
              </p>
              <strong>{workspaceName}</strong>
            </div>

            <div style={cardStyle()}>
              <p style={{ color: "#aaa", margin: "0 0 6px 0" }}>
                Logged In As
              </p>
              <strong>{fullName}</strong>
            </div>
          </div>

          <h2 style={{ margin: "0 0 10px 0" }}>Snapshot</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <Link
              href="/companies"
              style={{
                ...cardStyle(),
                color: "white",
                textDecoration: "none",
              }}
            >
              <p style={{ color: "#aaa", margin: "0 0 8px 0" }}>Companies</p>
              <h2 style={{ fontSize: "34px", margin: 0 }}>
                {companyCount ?? 0}
              </h2>
            </Link>

            <Link
              href="/contacts"
              style={{
                ...cardStyle(),
                color: "white",
                textDecoration: "none",
              }}
            >
              <p style={{ color: "#aaa", margin: "0 0 8px 0" }}>Contacts</p>
              <h2 style={{ fontSize: "34px", margin: 0 }}>
                {contactCount ?? 0}
              </h2>
            </Link>

            <Link
              href="/opportunities"
              style={{
                ...cardStyle(),
                color: "white",
                textDecoration: "none",
              }}
            >
              <p style={{ color: "#aaa", margin: "0 0 8px 0" }}>
                Opportunities
              </p>
              <h2 style={{ fontSize: "34px", margin: 0 }}>
                {opportunityCount ?? 0}
              </h2>
            </Link>

            <Link
              href="/tasks"
              style={{
                ...cardStyle(),
                color: "white",
                textDecoration: "none",
              }}
            >
              <p style={{ color: "#aaa", margin: "0 0 8px 0" }}>Open Tasks</p>
              <h2 style={{ fontSize: "34px", margin: 0 }}>
                {openTasks.length}
              </h2>
            </Link>
          </div>

          <h2 style={{ margin: "0 0 10px 0" }}>Dashboard</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div style={widgetStyle()}>
              <p style={{ color: "#aaa", margin: "0 0 6px 0" }}>
                Tasks Due Today
              </p>

              <h2 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
                {tasksDueToday.length}
              </h2>

              <div style={scrollAreaStyle()}>
                {tasksDueToday.length === 0 && (
                  <p style={{ color: "#aaa", marginTop: 0 }}>
                    No tasks due today.
                  </p>
                )}

                {tasksDueToday.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    style={listLinkStyle()}
                  >
                    <strong>{task.title}</strong>
                    <br />
                    <span style={{ color: "#aaa" }}>
                      {task.priority || "No priority"} -{" "}
                      {task.status || "No status"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div style={widgetStyle()}>
              <p style={{ color: "#aaa", margin: "0 0 6px 0" }}>
                Overdue Tasks
              </p>

              <h2 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
                {overdueTasks.length}
              </h2>

              <div style={scrollAreaStyle()}>
                {overdueTasks.length === 0 && (
                  <p style={{ color: "#aaa", marginTop: 0 }}>
                    No overdue tasks.
                  </p>
                )}

                {overdueTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    style={listLinkStyle()}
                  >
                    <strong>{task.title}</strong>
                    <br />
                    <span style={{ color: "#aaa" }}>
                      Due {formatDate(task.due_date)} -{" "}
                      {task.priority || "No priority"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div style={widgetStyle()}>
              <p style={{ color: "#aaa", margin: "0 0 6px 0" }}>
                Hot Opportunities
              </p>

              <h2 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
                {hotOpportunities.length}
              </h2>

              <div style={scrollAreaStyle()}>
                {hotOpportunities.length === 0 && (
                  <p style={{ color: "#aaa", marginTop: 0 }}>
                    No hot opportunities yet.
                  </p>
                )}

                {hotOpportunities.map((opportunity) => (
                  <Link
                    key={opportunity.id}
                    href={`/opportunities/${opportunity.id}`}
                    style={listLinkStyle()}
                  >
                    <strong>{opportunity.name}</strong>
                    <br />
                    <span style={{ color: "#aaa" }}>
                      {opportunity.companies?.name || "No company"} -{" "}
                      {opportunity.stage}
                      {opportunity.estimated_monthly_value !== null
                        ? ` - $${Number(
                            opportunity.estimated_monthly_value
                          ).toLocaleString()}/mo`
                        : ""}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div style={widgetStyle()}>
              <p style={{ color: "#aaa", margin: "0 0 6px 0" }}>
                Recent Activities
              </p>

              <h2 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
                {recentActivities.length}
              </h2>

              <div style={scrollAreaStyle()}>
                {recentActivities.length === 0 && (
                  <p style={{ color: "#aaa", marginTop: 0 }}>
                    No recent activities yet.
                  </p>
                )}

                {recentActivities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/activities/${activity.id}`}
                    style={listLinkStyle()}
                  >
                    <strong>{activity.subject}</strong>
                    <br />
                    <span style={{ color: "#aaa" }}>
                      {activity.activity_type} -{" "}
                      {activity.outcome || "No outcome"} -{" "}
                      {formatDateTime(activity.activity_date)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div style={widgetStyle()}>
              <p style={{ color: "#aaa", margin: "0 0 6px 0" }}>
                Recent Notes
              </p>

              <h2 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
                {recentNotes.length}
              </h2>

              <div style={scrollAreaStyle()}>
                {recentNotes.length === 0 && (
                  <p style={{ color: "#aaa", marginTop: 0 }}>
                    No recent notes yet.
                  </p>
                )}

                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    style={listLinkStyle()}
                  >
                    <strong>{note.title}</strong>
                    <br />
                    <span style={{ color: "#aaa" }}>
                      {note.body
                        ? note.body.length > 70
                          ? `${note.body.slice(0, 70)}...`
                          : note.body
                        : "No note body"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <HomeSearch />

          {profileError && (
            <p style={{ color: "red", marginTop: "32px" }}>
              Profile error: {profileError.message}
            </p>
          )}

          {companyCountError && (
            <p style={{ color: "red", marginTop: "32px" }}>
              Company count error: {companyCountError.message}
            </p>
          )}

          {contactCountError && (
            <p style={{ color: "red", marginTop: "32px" }}>
              Contact count error: {contactCountError.message}
            </p>
          )}

          {opportunityCountError && (
            <p style={{ color: "red", marginTop: "32px" }}>
              Opportunity count error: {opportunityCountError.message}
            </p>
          )}

          {taskError && (
            <p style={{ color: "red", marginTop: "32px" }}>
              Task error: {taskError.message}
            </p>
          )}

          {hotOpportunityError && (
            <p style={{ color: "red", marginTop: "32px" }}>
              Hot opportunity error: {hotOpportunityError.message}
            </p>
          )}

          {activityError && (
            <p style={{ color: "red", marginTop: "32px" }}>
              Activity error: {activityError.message}
            </p>
          )}

          {noteError && (
            <p style={{ color: "red", marginTop: "32px" }}>
              Note error: {noteError.message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}