import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";

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
  companies: {
    id: string;
    name: string;
  } | null;
  contacts: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
  opportunities: {
    id: string;
    name: string;
  } | null;
  assigned_profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: task, error } = await supabase
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

            <p>
              <strong>Priority:</strong> {task.priority}
            </p>

            <p>
              <strong>Due Date:</strong> {task.due_date || "Not provided"}
            </p>

            <p>
              <strong>Assigned To:</strong>{" "}
              {task.assigned_profile?.full_name ||
                task.assigned_profile?.email ||
                "Unassigned"}
            </p>

            <p>
              <strong>Related Company:</strong>{" "}
              {task.companies ? (
                <Link
                  href={`/companies/${task.companies.id}`}
                  style={{ color: "white" }}
                >
                  {task.companies.name}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Contact:</strong>{" "}
              {task.contacts ? (
                <Link
                  href={`/contacts/${task.contacts.id}`}
                  style={{ color: "white" }}
                >
                  {task.contacts.first_name} {task.contacts.last_name || ""}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Opportunity:</strong>{" "}
              {task.opportunities ? (
                <Link
                  href={`/opportunities/${task.opportunities.id}`}
                  style={{ color: "white" }}
                >
                  {task.opportunities.name}
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
              <strong>Created:</strong>{" "}
              {task.created_at
                ? new Date(task.created_at).toLocaleString()
                : "Not available"}
            </p>

            <p>
              <strong>Last Updated:</strong>{" "}
              {task.updated_at
                ? new Date(task.updated_at).toLocaleString()
                : "Not available"}
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