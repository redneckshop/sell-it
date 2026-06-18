import Link from "next/link";
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

type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
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
  completed_profile: SupabaseRelation<AssignedProfile>;
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
  const completedProfile = singleRelation(task?.completed_profile);

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
          href="/tasks"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Tasks
        </Link>

        {task && (
          <Link
            href={`/tasks/${task.id}/edit`}
            style={{
              color: "black",
              backgroundColor: "white",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Edit Task
          </Link>
        )}

        {task && (
          <Link
            href={`/tasks/${task.id}/delete`}
            style={{
              color: "black",
              backgroundColor: "#ffdddd",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Delete Task
          </Link>
        )}
      </div>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {task && (
        <section style={{ marginTop: "32px" }}>
          <h1>{task.title}</h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "700px",
              marginBottom: "40px",
            }}
          >
            <p>
              <strong>Status:</strong> {task.status}
            </p>

            {task.status === "Completed" && (
              <>
                <p>
                  <strong>Completed At:</strong>{" "}
                  {formatDateTime(task.completed_at)}
                </p>

                <p>
                  <strong>Completed By:</strong>{" "}
                  {completedProfile?.full_name ||
                    completedProfile?.email ||
                    "Not available"}
                </p>
              </>
            )}

            <p>
              <strong>Priority:</strong> {task.priority}
            </p>

            <p>
              <strong>Due Date:</strong> {task.due_date || "Not provided"}
            </p>

            <p>
              <strong>Assigned To:</strong>{" "}
              {assignedProfile?.full_name ||
                assignedProfile?.email ||
                "Unassigned"}
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
              <strong>Description:</strong>
            </p>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {task.description || "No description provided."}
            </p>

            <p>
              <strong>Created:</strong> {formatDateTime(task.created_at)}
            </p>

            <p>
              <strong>Last Updated:</strong> {formatDateTime(task.updated_at)}
            </p>
          </div>

          <AttachmentsSection
            workspaceId={task.workspace_id}
            relationColumn="related_task_id"
            relationId={task.id}
          />
        </section>
      )}
    </main>
  );
}
