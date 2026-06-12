import Link from "next/link";
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

type Company = {
  id: string;
  name: string;
  lead_temperature: string | null;
};

type Activity = {
  id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  outcome: string | null;
};

function getTodayString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function cardStyle() {
  return {
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "20px",
    backgroundColor: "#1a1a1a",
  };
}

function buttonStyle() {
  return {
    display: "inline-block",
    backgroundColor: "white",
    color: "black",
    padding: "10px 14px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "bold",
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

  const { data: taskRows, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date")
    .order("due_date", { ascending: true });

  const allTasks: Task[] = taskRows ?? [];

  const openTasks = allTasks.filter(
    (task) => task.status !== "Completed" && task.status !== "Cancelled"
  );

  const tasksDueToday = openTasks.filter((task) => task.due_date === today);

  const overdueTasks = openTasks.filter(
    (task) => task.due_date && task.due_date < today
  );

  const { data: hotLeadRows, error: hotLeadError } = await supabase
    .from("companies")
    .select("id, name, lead_temperature")
    .eq("lead_temperature", "Hot")
    .order("name", { ascending: true })
    .limit(5);

  const hotLeads: Company[] = hotLeadRows ?? [];

  const { data: activityRows, error: activityError } = await supabase
    .from("activities")
    .select("id, activity_type, activity_date, subject, outcome")
    .order("activity_date", { ascending: false })
    .limit(5);

  const recentActivities: Activity[] = activityRows ?? [];

  const quickAdds = [
    {
      title: "+ Company",
      href: "/companies/new",
    },
    {
      title: "+ Contact",
      href: "/contacts/new",
    },
    {
      title: "+ Task",
      href: "/tasks/new",
    },
    {
      title: "+ Activity",
      href: "/activities/new",
    },
  ];

  const features = [
    {
      title: "Companies",
      description: "Manage businesses, prospects, and customer organizations.",
      href: "/companies",
    },
    {
      title: "Contacts",
      description: "Manage people connected to companies and sales follow-ups.",
      href: "/contacts",
    },
    {
      title: "Tasks",
      description: "Track follow-ups, assignments, due dates, and priorities.",
      href: "/tasks",
    },
    {
      title: "Activities",
      description:
        "Record calls, messages, meetings, notes, outcomes, and follow-ups.",
      href: "/activities",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>SELL IT</h1>

          <p style={{ color: "#aaa", fontSize: "18px", lineHeight: "1.5" }}>
            Command center for sales follow-ups, leads, contacts, tasks, and activity.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div style={cardStyle()}>
            <p style={{ color: "#aaa", marginTop: 0 }}>Connected Workspace</p>
            <h2 style={{ marginBottom: 0 }}>{workspaceName}</h2>
          </div>

          <div style={cardStyle()}>
            <p style={{ color: "#aaa", marginTop: 0 }}>Logged In As</p>
            <h2 style={{ marginBottom: 0 }}>{fullName}</h2>
          </div>
        </div>

        <h2>Dashboard</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div style={cardStyle()}>
            <p style={{ color: "#aaa", marginTop: 0 }}>Tasks Due Today</p>

            <h2 style={{ fontSize: "42px", margin: "8px 0" }}>
              {tasksDueToday.length}
            </h2>

            {tasksDueToday.length === 0 && (
              <p style={{ color: "#aaa" }}>No tasks due today.</p>
            )}

            {tasksDueToday.slice(0, 3).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                style={{
                  display: "block",
                  color: "white",
                  textDecoration: "none",
                  marginBottom: "8px",
                }}
              >
                {task.title}
              </Link>
            ))}
          </div>

          <div style={cardStyle()}>
            <p style={{ color: "#aaa", marginTop: 0 }}>Overdue Tasks</p>

            <h2 style={{ fontSize: "42px", margin: "8px 0" }}>
              {overdueTasks.length}
            </h2>

            {overdueTasks.length === 0 && (
              <p style={{ color: "#aaa" }}>No overdue tasks.</p>
            )}

            {overdueTasks.slice(0, 3).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                style={{
                  display: "block",
                  color: "white",
                  textDecoration: "none",
                  marginBottom: "8px",
                }}
              >
                {task.title}
              </Link>
            ))}
          </div>

          <div style={cardStyle()}>
            <p style={{ color: "#aaa", marginTop: 0 }}>Hot Leads</p>

            <h2 style={{ fontSize: "42px", margin: "8px 0" }}>
              {hotLeads.length}
            </h2>

            {hotLeads.length === 0 && (
              <p style={{ color: "#aaa" }}>No hot leads yet.</p>
            )}

            {hotLeads.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                style={{
                  display: "block",
                  color: "white",
                  textDecoration: "none",
                  marginBottom: "8px",
                }}
              >
                {company.name}
              </Link>
            ))}
          </div>

          <div style={cardStyle()}>
            <p style={{ color: "#aaa", marginTop: 0 }}>Recent Activity</p>

            <h2 style={{ fontSize: "42px", margin: "8px 0" }}>
              {recentActivities.length}
            </h2>

            {recentActivities.length === 0 && (
              <p style={{ color: "#aaa" }}>No activity yet.</p>
            )}

            {recentActivities.slice(0, 3).map((activity) => (
              <Link
                key={activity.id}
                href={`/activities/${activity.id}`}
                style={{
                  display: "block",
                  color: "white",
                  textDecoration: "none",
                  marginBottom: "8px",
                }}
              >
                {activity.subject}
              </Link>
            ))}
          </div>
        </div>

        <HomeSearch />

        <h2>Quick Add</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {quickAdds.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...buttonStyle(),
                textAlign: "center",
                fontSize: "18px",
                padding: "18px",
              }}
            >
              {item.title}
            </Link>
          ))}
        </div>

        <h2>Navigation</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              style={{
                display: "block",
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "24px",
                backgroundColor: "#1a1a1a",
                color: "white",
                textDecoration: "none",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "24px" }}>
                {feature.title}
              </h3>

              <p style={{ color: "#aaa", lineHeight: "1.5" }}>
                {feature.description}
              </p>

              <div style={buttonStyle()}>Open {feature.title}</div>
            </Link>
          ))}
        </div>

        {profileError && (
          <p style={{ color: "red", marginTop: "32px" }}>
            Profile error: {profileError.message}
          </p>
        )}

        {taskError && (
          <p style={{ color: "red", marginTop: "32px" }}>
            Task error: {taskError.message}
          </p>
        )}

        {hotLeadError && (
          <p style={{ color: "red", marginTop: "32px" }}>
            Hot lead error: {hotLeadError.message}
          </p>
        )}

        {activityError && (
          <p style={{ color: "red", marginTop: "32px" }}>
            Activity error: {activityError.message}
          </p>
        )}
      </section>
    </main>
  );
}