import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";

type Activity = {
  id: string;
  workspace_id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  summary: string | null;
  raw_notes: string | null;
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

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: activity, error } = await supabase
    .from("activities")
    .select(`
      id,
      workspace_id,
      activity_type,
      activity_date,
      subject,
      summary,
      raw_notes,
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
    .eq("id", id)
    .single();

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
          href="/activities"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Activities
        </Link>
      </div>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {activity && (
        <section style={{ marginTop: "32px" }}>
          <h1>{activity.subject}</h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "750px",
              marginBottom: "40px",
            }}
          >
            <p>
              <strong>Activity Type:</strong> {activity.activity_type}
            </p>

            <p>
              <strong>Activity Date:</strong>{" "}
              {new Date(activity.activity_date).toLocaleString()}
            </p>

            <p>
              <strong>Outcome:</strong> {activity.outcome || "Not provided"}
            </p>

            <p>
              <strong>Follow Up Needed:</strong>{" "}
              {activity.follow_up_needed ? "Yes" : "No"}
            </p>

            <p>
              <strong>Related Company:</strong>{" "}
              {activity.companies ? (
                <Link
                  href={`/companies/${activity.companies.id}`}
                  style={{ color: "white" }}
                >
                  {activity.companies.name}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Contact:</strong>{" "}
              {activity.contacts ? (
                <Link
                  href={`/contacts/${activity.contacts.id}`}
                  style={{ color: "white" }}
                >
                  {activity.contacts.first_name}{" "}
                  {activity.contacts.last_name || ""}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Task:</strong>{" "}
              {activity.tasks ? (
                <Link
                  href={`/tasks/${activity.tasks.id}`}
                  style={{ color: "white" }}
                >
                  {activity.tasks.title}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Summary:</strong>
            </p>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {activity.summary || "No summary provided."}
            </p>

            <p>
              <strong>Raw Notes:</strong>
            </p>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {activity.raw_notes || "No raw notes provided."}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {activity.created_at
                ? new Date(activity.created_at).toLocaleString()
                : "Not available"}
            </p>
          </div>

          <AttachmentsSection
            workspaceId={activity.workspace_id}
            relationColumn="related_activity_id"
            relationId={activity.id}
          />
        </section>
      )}
    </main>
  );
}