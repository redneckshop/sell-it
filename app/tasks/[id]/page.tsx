import { formatDateOnly, formatDateTimeLocal } from "../../lib/dateUtils";
import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";

type SupabaseRelation<T> = T | T[] | null;

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

type AssignedProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type AssignedTeamMember = {
  id: string;
  profile_id: string | null;
  display_name: string;
  email: string | null;
  role_title: string | null;
  status: string;
};

type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  assigned_team_member_id: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  companies: SupabaseRelation<RelatedCompany>;
  contacts: SupabaseRelation<RelatedContact>;
  opportunities: SupabaseRelation<RelatedOpportunity>;
  assigned_profile: SupabaseRelation<AssignedProfile>;
  assigned_team_member: SupabaseRelation<AssignedTeamMember>;
  completed_profile: SupabaseRelation<AssignedProfile>;
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

const headerStyle: CSSProperties = {
  maxWidth: "980px",
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#a78bfa",
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
  maxWidth: "860px",
  lineHeight: 1.65,
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  maxWidth: "980px",
  marginBottom: "22px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const primaryButtonStyle: CSSProperties = {
  color: "white",
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.28)",
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

const dangerButtonStyle: CSSProperties = {
  color: "#fecaca",
  background: "rgba(127, 29, 29, 0.24)",
  border: "1px solid rgba(248, 113, 113, 0.35)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
};

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  textDecoration: "none",
  fontWeight: 800,
};

const labelStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const valueStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#f8fafc",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const completedBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid rgba(34, 197, 94, 0.32)",
  background: "rgba(20, 83, 45, 0.22)",
  color: "#bbf7d0",
  borderRadius: "999px",
  padding: "8px 12px",
  fontWeight: 900,
  fontSize: "13px",
};

const openBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid rgba(167, 139, 250, 0.32)",
  background: "rgba(88, 28, 135, 0.22)",
  color: "#ddd6fe",
  borderRadius: "999px",
  padding: "8px 12px",
  fontWeight: 900,
  fontSize: "13px",
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function assignedTeamMemberLabel(
  teamMember: AssignedTeamMember | null,
  profile: AssignedProfile | null
) {
  return (
    teamMember?.display_name ||
    teamMember?.email ||
    profile?.full_name ||
    profile?.email ||
    "Unassigned"
  );
}

function formatDateTime(value: string | null) {
  return formatDateTimeLocal(value);
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: taskRow, error } = await supabase
    .from("tasks")
    .select(`
      id,
      workspace_id,
      title,
      description,
      due_date,
      priority,
      status,
      assigned_to,
      assigned_team_member_id,
      company_id,
      contact_id,
      opportunity_id,
      created_at,
      updated_at,
      completed_at,
      completed_by,
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
      assigned_profile:profiles!tasks_assigned_to_fkey (
        id,
        full_name,
        email
      ),
      assigned_team_member:team_members!tasks_assigned_team_member_id_fkey (
        id,
        profile_id,
        display_name,
        email,
        role_title,
        status
      ),
      completed_profile:profiles!tasks_completed_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq("id", id)
    .single();

  const task = taskRow as unknown as Task | null;

  const company = singleRelation(task?.companies);
  const contact = singleRelation(task?.contacts);
  const opportunity = singleRelation(task?.opportunities);
  const assignedProfile = singleRelation(task?.assigned_profile);
  const assignedTeamMember = singleRelation(task?.assigned_team_member);
  const completedProfile = singleRelation(task?.completed_profile);

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href="/tasks" style={secondaryButtonStyle}>
          Back to Tasks
        </Link>

        {task && (
          <Link href={`/tasks/${task.id}/edit`} style={secondaryButtonStyle}>
            Edit Task
          </Link>
        )}

        {task && task.status !== "Completed" && (
          <Link
            href={`/assistant/actions/tasks/${task.id}/complete`}
            style={primaryButtonStyle}
          >
            Mark Complete
          </Link>
        )}

        {task && (
          <Link href={`/tasks/${task.id}/delete`} style={dangerButtonStyle}>
            Delete Task
          </Link>
        )}
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Task Detail</p>

        <h1 style={titleStyle}>{task?.title || "Task not found"}</h1>

        <p style={mutedTextStyle}>
          Review the work item, linked sales records, assignment, completion
          status, and supporting attachments.
        </p>
      </header>

      {error && (
        <div
          style={{
            ...cardStyle,
            border: "1px solid rgba(248, 113, 113, 0.36)",
            background: "rgba(127, 29, 29, 0.22)",
            color: "#fecaca",
          }}
        >
          Database error: {error.message}
        </div>
      )}

      {task && (
        <>
          <section style={cardStyle}>
            <div style={{ marginBottom: "18px" }}>
              {task.status === "Completed" ? (
                <span style={completedBadgeStyle}>Completed</span>
              ) : (
                <span style={openBadgeStyle}>{task.status || "Open"}</span>
              )}
            </div>

            <div style={gridStyle}>
              <div>
                <div style={labelStyle}>Status</div>
                <p style={valueStyle}>{task.status || "Not provided"}</p>
              </div>

              <div>
                <div style={labelStyle}>Priority</div>
                <p style={valueStyle}>{task.priority || "Not provided"}</p>
              </div>

              <div>
                <div style={labelStyle}>Due Date</div>
                <p style={valueStyle}>{task.due_date ? formatDateOnly(task.due_date) : "Not provided"}</p>
              </div>

              <div>
                <div style={labelStyle}>Assigned To</div>
                <p style={valueStyle}>
                  {assignedTeamMemberLabel(assignedTeamMember, assignedProfile)}
                </p>
              </div>

              {task.status === "Completed" && (
                <>
                  <div>
                    <div style={labelStyle}>Completed At</div>
                    <p style={valueStyle}>{formatDateTime(task.completed_at)}</p>
                  </div>

                  <div>
                    <div style={labelStyle}>Completed By</div>
                    <p style={valueStyle}>
                      {completedProfile?.full_name ||
                        completedProfile?.email ||
                        "Not available"}
                    </p>
                  </div>
                </>
              )}

              <div>
                <div style={labelStyle}>Related Company</div>
                <p style={valueStyle}>
                  {company ? (
                    <Link href={`/companies/${company.id}`} style={linkStyle}>
                      {company.name}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Related Contact</div>
                <p style={valueStyle}>
                  {contact ? (
                    <Link href={`/contacts/${contact.id}`} style={linkStyle}>
                      {contact.first_name} {contact.last_name || ""}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Related Opportunity</div>
                <p style={valueStyle}>
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

              <div>
                <div style={labelStyle}>Created</div>
                <p style={valueStyle}>{formatDateTime(task.created_at)}</p>
              </div>

              <div>
                <div style={labelStyle}>Last Updated</div>
                <p style={valueStyle}>{formatDateTime(task.updated_at)}</p>
              </div>
            </div>

            <div style={{ marginTop: "22px" }}>
              <div style={labelStyle}>Description</div>
              <p
                style={{
                  whiteSpace: "pre-wrap",
                  color: "#cbd5e1",
                  lineHeight: 1.65,
                  marginBottom: 0,
                }}
              >
                {task.description || "No description provided."}
              </p>
            </div>
          </section>

          <section style={cardStyle}>
            <p style={eyebrowStyle}>Attachments</p>
            <AttachmentsSection
              workspaceId={task.workspace_id}
              relationColumn="related_task_id"
              relationId={task.id}
            />
          </section>
        </>
      )}
    </main>
  );
}


