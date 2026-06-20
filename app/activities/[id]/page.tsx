import Link from "next/link";
import type { CSSProperties } from "react";
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

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const secondaryButtonStyle: CSSProperties = {
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  border: "1px solid rgba(168, 85, 247, 0.55)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  boxShadow: "0 16px 40px rgba(124, 58, 237, 0.28)",
};

const dangerButtonStyle: CSSProperties = {
  color: "#fecaca",
  background: "rgba(127, 29, 29, 0.24)",
  border: "1px solid rgba(248, 113, 113, 0.35)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
};

const headerStyle: CSSProperties = {
  maxWidth: "1080px",
  marginBottom: "24px",
  border: "1px solid rgba(124, 58, 237, 0.22)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "34px",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  maxWidth: "900px",
  lineHeight: 1.65,
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  marginBottom: "16px",
  maxWidth: "1080px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.22)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const metaCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: "16px",
  padding: "14px",
  background: "rgba(15, 23, 42, 0.55)",
};

const metaLabelStyle: CSSProperties = {
  margin: "0 0 6px",
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const metaValueStyle: CSSProperties = {
  margin: 0,
  color: "#f8fafc",
  fontWeight: 800,
};

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 900,
  textDecoration: "none",
};

const textBlockStyle: CSSProperties = {
  whiteSpace: "pre-wrap",
  color: "#e2e8f0",
  lineHeight: 1.65,
  marginTop: "8px",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginTop: "18px",
  maxWidth: "1080px",
  fontWeight: 800,
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
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href="/activities" style={secondaryButtonStyle}>
          Back to Activities
        </Link>

        {activity && (
          <Link href={`/activities/${activity.id}/edit`} style={primaryButtonStyle}>
            Edit Activity
          </Link>
        )}

        {activity && (
          <Link href={`/activities/${activity.id}/delete`} style={dangerButtonStyle}>
            Delete Activity
          </Link>
        )}
      </div>

      {error && <div style={errorStyle}>Database error: {error.message}</div>}

      {activity && (
        <>
          <header style={headerStyle}>
            <p style={eyebrowStyle}>Activity Detail</p>

            <h1 style={titleStyle}>{activity.subject}</h1>

            <p style={mutedTextStyle}>
              Review the activity details, related sales records, summary, raw
              notes, and attachments connected to this activity.
            </p>
          </header>

          <section style={cardStyle}>
            <div style={gridStyle}>
              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Activity Type</p>
                <p style={metaValueStyle}>{activity.activity_type}</p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Activity Date</p>
                <p style={metaValueStyle}>
                  {formatDateTime(activity.activity_date)}
                </p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Outcome</p>
                <p style={metaValueStyle}>{activity.outcome || "Not provided"}</p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Follow Up Needed</p>
                <p style={metaValueStyle}>
                  {activity.follow_up_needed ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div style={gridStyle}>
              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Related Company</p>
                <p style={metaValueStyle}>
                  {company ? (
                    <Link href={`/companies/${company.id}`} style={linkStyle}>
                      {company.name}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Related Contact</p>
                <p style={metaValueStyle}>
                  {contact ? (
                    <Link href={`/contacts/${contact.id}`} style={linkStyle}>
                      {contact.first_name} {contact.last_name || ""}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Related Opportunity</p>
                <p style={metaValueStyle}>
                  {opportunity ? (
                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      style={linkStyle}
                    >
                      {opportunity.name}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Related Task</p>
                <p style={metaValueStyle}>
                  {task ? (
                    <Link href={`/tasks/${task.id}`} style={linkStyle}>
                      {task.title}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>
            </div>

            <section style={{ marginTop: "18px" }}>
              <h2 style={{ marginBottom: 0 }}>Summary</h2>
              <p style={textBlockStyle}>
                {activity.summary || "No summary provided."}
              </p>
            </section>

            <section style={{ marginTop: "18px" }}>
              <h2 style={{ marginBottom: 0 }}>Raw Notes</h2>
              <p style={textBlockStyle}>
                {activity.raw_notes || "No raw notes provided."}
              </p>
            </section>

            <div style={{ ...gridStyle, marginTop: "18px", marginBottom: 0 }}>
              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Created</p>
                <p style={metaValueStyle}>{formatDateTime(activity.created_at)}</p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Last Updated</p>
                <p style={metaValueStyle}>{formatDateTime(activity.updated_at)}</p>
              </div>
            </div>
          </section>

          <AttachmentsSection
            workspaceId={activity.workspace_id}
            relationColumn="related_activity_id"
            relationId={activity.id}
          />
        </>
      )}
    </main>
  );
}