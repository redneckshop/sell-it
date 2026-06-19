import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "./lib/supabase";
import HomeSearch from "./components/HomeSearch";

type SupabaseRelation<T> = T | T[] | null;

type ProfileWorkspace = {
  name: string | null;
};

type Profile = {
  full_name: string | null;
  email: string | null;
  workspaces: SupabaseRelation<ProfileWorkspace>;
};

type Task = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
};

type RelatedCompany = {
  id: string;
  name: string;
};

type HotOpportunity = {
  id: string;
  name: string;
  stage: string;
  lead_temperature: string;
  estimated_monthly_value: number | null;
  companies: SupabaseRelation<RelatedCompany>;
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

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

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
    border: "1px solid #2f2f2f",
    borderRadius: "14px",
    padding: "16px",
    background:
      "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
  };
}

function widgetStyle(): CSSProperties {
  return {
    ...cardStyle(),
    minHeight: "230px",
  };
}

function scrollAreaStyle(): CSSProperties {
  return {
    maxHeight: "140px",
    overflowY: "auto",
    paddingRight: "6px",
  };
}

function listLinkStyle(): CSSProperties {
  return {
    display: "block",
    color: "white",
    textDecoration: "none",
    marginBottom: "12px",
    lineHeight: "1.35",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
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

  const profile = profiles?.[0] as unknown as Profile | undefined;
  const workspace = singleRelation(profile?.workspaces);
  const workspaceName = workspace?.name ?? "No workspace found";
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

  const allTasks = (taskRows ?? []) as unknown as Task[];

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

  const hotOpportunities = (hotOpportunityRows ??
    []) as unknown as HotOpportunity[];

  const { data: activityRows, error: activityError } = await supabase
    .from("activities")
    .select("id, activity_type, activity_date, subject, outcome")
    .order("activity_date", { ascending: false })
    .limit(10);

  const recentActivities = (activityRows ?? []) as unknown as Activity[];

  const { data: noteRows, error: noteError } = await supabase
    .from("notes")
    .select("id, title, body, source, tags, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const recentNotes = (noteRows ?? []) as unknown as Note[];

  return (
    <main
      style={{
        minHeight: "calc(100vh - 64px)",
        background:
          "radial-gradient(circle at top left, rgba(124,58,237,0.16), transparent 34%), #101010",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "34px",
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          maxWidth: "1220px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 420px)",
            gap: "18px",
            alignItems: "start",
            marginBottom: "22px",
          }}
        >
          <div>
            <p
              style={{
                ...mutedTextStyle(),
                textTransform: "uppercase",
                letterSpacing: "2px",
                margin: "0 0 8px",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              Business Command Center
            </p>

            <h1 style={{ fontSize: "40px", margin: "0 0 8px" }}>
              Good morning, Charles
            </h1>

            <p
              style={{
                ...mutedTextStyle(),
                fontSize: "16px",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              Sales follow-ups, leads, contacts, tasks, opportunities, notes,
              and daily activity in one place.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <div style={cardStyle()}>
              <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>
                Connected Workspace
              </p>
              <strong>{workspaceName}</strong>
            </div>

            <div style={cardStyle()}>
              <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>
                Logged In As
              </p>
              <strong>{fullName}</strong>
            </div>
          </div>
        </div>

        <h2 style={{ margin: "0 0 12px" }}>Snapshot</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
            gap: "12px",
            marginBottom: "24px",
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
            <p style={{ ...mutedTextStyle(), margin: "0 0 10px" }}>
              Companies
            </p>
            <h2 style={{ fontSize: "34px", margin: 0 }}>{companyCount ?? 0}</h2>
            <p style={{ ...mutedTextStyle(), margin: "8px 0 0" }}>Active</p>
          </Link>

          <Link
            href="/contacts"
            style={{
              ...cardStyle(),
              color: "white",
              textDecoration: "none",
            }}
          >
            <p style={{ ...mutedTextStyle(), margin: "0 0 10px" }}>Contacts</p>
            <h2 style={{ fontSize: "34px", margin: 0 }}>{contactCount ?? 0}</h2>
            <p style={{ ...mutedTextStyle(), margin: "8px 0 0" }}>Total</p>
          </Link>

          <Link
            href="/opportunities"
            style={{
              ...cardStyle(),
              color: "white",
              textDecoration: "none",
            }}
          >
            <p style={{ ...mutedTextStyle(), margin: "0 0 10px" }}>
              Opportunities
            </p>
            <h2 style={{ fontSize: "34px", margin: 0 }}>
              {opportunityCount ?? 0}
            </h2>
            <p style={{ ...mutedTextStyle(), margin: "8px 0 0" }}>Active</p>
          </Link>

          <Link
            href="/tasks"
            style={{
              ...cardStyle(),
              color: "white",
              textDecoration: "none",
            }}
          >
            <p style={{ ...mutedTextStyle(), margin: "0 0 10px" }}>
              Open Tasks
            </p>
            <h2 style={{ fontSize: "34px", margin: 0 }}>{openTasks.length}</h2>
            <p style={{ ...mutedTextStyle(), margin: "8px 0 0" }}>
              Outstanding
            </p>
          </Link>

          <Link
            href="/planner"
            style={{
              ...cardStyle(),
              color: "white",
              textDecoration: "none",
            }}
          >
            <p style={{ ...mutedTextStyle(), margin: "0 0 10px" }}>
              Planner Today
            </p>
            <h2 style={{ fontSize: "34px", margin: 0 }}>
              {tasksDueToday.length}
            </h2>
            <p
              style={{
                color: overdueTasks.length > 0 ? "#f97316" : "#a7a7a7",
                margin: "8px 0 0",
              }}
            >
              {overdueTasks.length} overdue
            </p>
          </Link>
        </div>

        <h2 style={{ margin: "0 0 12px" }}>Today</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(285px, 1fr))",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div style={widgetStyle()}>
            <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>
              Tasks Due Today
            </p>

            <h2 style={{ fontSize: "32px", margin: "0 0 10px" }}>
              {tasksDueToday.length}
            </h2>

            <div style={scrollAreaStyle()}>
              {tasksDueToday.length === 0 && (
                <p style={{ ...mutedTextStyle(), marginTop: 0 }}>
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
                  <span style={mutedTextStyle()}>
                    {task.priority || "No priority"} -{" "}
                    {task.status || "No status"}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div style={widgetStyle()}>
            <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>
              Overdue Tasks
            </p>

            <h2 style={{ fontSize: "32px", margin: "0 0 10px" }}>
              {overdueTasks.length}
            </h2>

            <div style={scrollAreaStyle()}>
              {overdueTasks.length === 0 && (
                <p style={{ ...mutedTextStyle(), marginTop: 0 }}>
                  Great. No overdue tasks.
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
                  <span style={mutedTextStyle()}>
                    Due {formatDate(task.due_date)} -{" "}
                    {task.priority || "No priority"}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div style={widgetStyle()}>
            <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>
              Hot Opportunities
            </p>

            <h2 style={{ fontSize: "32px", margin: "0 0 10px" }}>
              {hotOpportunities.length}
            </h2>

            <div style={scrollAreaStyle()}>
              {hotOpportunities.length === 0 && (
                <p style={{ ...mutedTextStyle(), marginTop: 0 }}>
                  No hot opportunities yet.
                </p>
              )}

              {hotOpportunities.map((opportunity) => {
                const company = singleRelation(opportunity.companies);

                return (
                  <Link
                    key={opportunity.id}
                    href={`/opportunities/${opportunity.id}`}
                    style={listLinkStyle()}
                  >
                    <strong>{opportunity.name}</strong>
                    <br />
                    <span style={mutedTextStyle()}>
                      {company?.name || "No company"} - {opportunity.stage}
                      {opportunity.estimated_monthly_value !== null
                        ? ` - $${Number(
                            opportunity.estimated_monthly_value
                          ).toLocaleString()}/mo`
                        : ""}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div style={widgetStyle()}>
            <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>
              Recent Activities
            </p>

            <h2 style={{ fontSize: "32px", margin: "0 0 10px" }}>
              {recentActivities.length}
            </h2>

            <div style={scrollAreaStyle()}>
              {recentActivities.length === 0 && (
                <p style={{ ...mutedTextStyle(), marginTop: 0 }}>
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
                  <span style={mutedTextStyle()}>
                    {activity.activity_type} -{" "}
                    {activity.outcome || "No outcome"} -{" "}
                    {formatDateTime(activity.activity_date)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div style={widgetStyle()}>
            <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>
              Recent Notes
            </p>

            <h2 style={{ fontSize: "32px", margin: "0 0 10px" }}>
              {recentNotes.length}
            </h2>

            <div style={scrollAreaStyle()}>
              {recentNotes.length === 0 && (
                <p style={{ ...mutedTextStyle(), marginTop: 0 }}>
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
                  <span style={mutedTextStyle()}>
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
    </main>
  );
}
