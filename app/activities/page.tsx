import Link from "next/link";
import { supabase } from "../lib/supabase";

type Activity = {
  id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  summary: string | null;
  outcome: string | null;
  follow_up_needed: boolean;
  company_id: string | null;
  contact_id: string | null;
  task_id: string | null;
  created_at: string | null;
  companies: {
    id: string;
    name: string;
  } | null;
  contacts: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
  tasks: {
    id: string;
    title: string;
  } | null;
};

export default async function ActivitiesPage() {
  const { data, error } = await supabase
    .from("activities")
    .select(`
      id,
      activity_type,
      activity_date,
      subject,
      summary,
      outcome,
      follow_up_needed,
      company_id,
      contact_id,
      task_id,
      created_at,
      companies (
        id,
        name
      ),
      contacts (
        id,
        first_name,
        last_name
      ),
      tasks (
        id,
        title
      )
    `)
    .order("activity_date", { ascending: false });

  const activities: Activity[] = data ?? [];

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1>Activities</h1>

          <p style={{ color: "#aaa" }}>
            Sales conversations, notes, calls, meetings, messages, and research.
          </p>
        </div>

        <Link
          href="/activities/new"
          style={{
            backgroundColor: "white",
            color: "black",
            padding: "12px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Activity
        </Link>
      </div>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && activities.length === 0 && <p>No activities found.</p>}

      {activities.map((activity) => (
        <Link
          key={activity.id}
          href={`/activities/${activity.id}`}
          style={{
            display: "block",
            border: "1px solid #333",
            padding: "16px",
            marginBottom: "12px",
            borderRadius: "8px",
            backgroundColor: "#1a1a1a",
            color: "white",
            textDecoration: "none",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{activity.subject}</h2>

          <p>Type: {activity.activity_type}</p>
          <p>Date: {new Date(activity.activity_date).toLocaleString()}</p>

          {activity.outcome && <p>Outcome: {activity.outcome}</p>}

          {activity.follow_up_needed && (
            <p style={{ fontWeight: "bold" }}>Follow Up Needed</p>
          )}

          {activity.companies?.name && (
            <p>Company: {activity.companies.name}</p>
          )}

          {activity.contacts && (
            <p>
              Contact: {activity.contacts.first_name}{" "}
              {activity.contacts.last_name || ""}
            </p>
          )}

          {activity.tasks?.title && <p>Task: {activity.tasks.title}</p>}

          {activity.summary && <p>Summary: {activity.summary}</p>}
        </Link>
      ))}
    </main>
  );
}