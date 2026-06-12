import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Company = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

type Activity = {
  id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  outcome: string | null;
  follow_up_needed: boolean;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, website, phone, email, created_at")
    .eq("id", id)
    .single();

  const { data: contactRows } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, title")
    .eq("company_id", id)
    .order("first_name", { ascending: true });

  const { data: taskRows } = await supabase
    .from("tasks")
    .select("id, title, status, priority")
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  const { data: activityRows } = await supabase
    .from("activities")
    .select("id, activity_type, activity_date, subject, outcome, follow_up_needed")
    .eq("company_id", id)
    .order("activity_date", { ascending: false });

  const contacts: Contact[] = contactRows ?? [];
  const tasks: Task[] = taskRows ?? [];
  const activities: Activity[] = activityRows ?? [];

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
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Home
        </Link>

        <Link
          href="/companies"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Companies
        </Link>
      </div>

      {error && <p style={{ color: "red" }}>Database error: {error.message}</p>}

      {company && (
        <>
          <h1>{company.name}</h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "650px",
              marginBottom: "40px",
            }}
          >
            <p>
              <strong>Website:</strong> {company.website || "Not provided"}
            </p>

            <p>
              <strong>Phone:</strong> {company.phone || "Not provided"}
            </p>

            <p>
              <strong>Email:</strong> {company.email || "Not provided"}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {company.created_at
                ? new Date(company.created_at).toLocaleString()
                : "Not available"}
            </p>
          </div>

          <h2>Related Contacts</h2>

          {contacts.length === 0 && <p>No contacts linked to this company.</p>}

          {contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              style={{
                display: "block",
                border: "1px solid #333",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
                color: "white",
                textDecoration: "none",
                maxWidth: "750px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {contact.first_name} {contact.last_name || ""}
              </h3>

              {contact.title && <p>Title: {contact.title}</p>}
              {contact.email && <p>Email: {contact.email}</p>}
              {contact.phone && <p>Phone: {contact.phone}</p>}
            </Link>
          ))}

          <h2 style={{ marginTop: "40px" }}>Related Tasks</h2>

          {tasks.length === 0 && <p>No tasks linked to this company.</p>}

          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              style={{
                display: "block",
                border: "1px solid #333",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
                color: "white",
                textDecoration: "none",
                maxWidth: "750px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{task.title}</h3>
              <p>Status: {task.status}</p>
              <p>Priority: {task.priority}</p>
            </Link>
          ))}

          <h2 style={{ marginTop: "40px" }}>Related Activities</h2>

          {activities.length === 0 && (
            <p>No activities linked to this company.</p>
          )}

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
                maxWidth: "750px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{activity.subject}</h3>

              <p>Type: {activity.activity_type}</p>

              <p>
                Date: {new Date(activity.activity_date).toLocaleString()}
              </p>

              {activity.outcome && <p>Outcome: {activity.outcome}</p>}

              {activity.follow_up_needed && (
                <p style={{ fontWeight: "bold" }}>Follow Up Needed</p>
              )}
            </Link>
          ))}
        </>
      )}
    </main>
  );
}