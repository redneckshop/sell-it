import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";

type RelatedCompany = {
  id: string;
  name: string;
};

type RelatedContact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type RelatedOpportunity = {
  id: string;
  name: string;
};

type RelatedTask = {
  id: string;
  title: string;
};

type SupabaseRelation<T> = T | T[] | null;

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
  opportunity_id: string | null;
  task_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  companies: SupabaseRelation<RelatedCompany>;
  contacts: SupabaseRelation<RelatedContact>;
  opportunities: SupabaseRelation<RelatedOpportunity>;
  tasks: SupabaseRelation<RelatedTask>;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: activityRow, error } = await supabase
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
      opportunity_id,
      task_id,
      created_at,
      updated_at,
      companies (
        id,
        name
      ),
      contacts (
        id,
        first_name,
        last_name
      ),
      opportunities (
        id,
        name
      ),
      tasks (
        id,
        title
      )
    `)
    .eq("id", id)
    .single();

  const activity = activityRow as unknown as Activity | null;

  const company = singleRelation(activity?.companies);
  const contact = singleRelation(activity?.contacts);
  const opportunity = singleRelation(activity?.opportunities);
  const task = singleRelation(activity?.tasks);

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

        {activity && (
          <Link
            href={`/activities/${activity.id}/edit`}
            style={{
              color: "black",
              backgroundColor: "white",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Edit Activity
          </Link>
        )}
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
              {formatDateTime(activity.activity_date)}
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
              {company ? (
                <Link
                  href={`/companies/${company.id}`}
                  style={{ color: "white" }}
                >
                  {company.name}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Contact:</strong>{" "}
              {contact ? (
                <Link
                  href={`/contacts/${contact.id}`}
                  style={{ color: "white" }}
                >
                  {contact.first_name} {contact.last_name || ""}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Opportunity:</strong>{" "}
              {opportunity ? (
                <Link
                  href={`/opportunities/${opportunity.id}`}
                  style={{ color: "white" }}
                >
                  {opportunity.name}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Task:</strong>{" "}
              {task ? (
                <Link href={`/tasks/${task.id}`} style={{ color: "white" }}>
                  {task.title}
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
              <strong>Created:</strong> {formatDateTime(activity.created_at)}
            </p>

            <p>
              <strong>Last Updated:</strong>{" "}
              {formatDateTime(activity.updated_at)}
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