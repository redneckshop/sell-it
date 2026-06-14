import Link from "next/link";
import { supabase } from "../lib/supabase";

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

type AssignedProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  company_id: string | null;
  contact_id: string | null;
  created_at: string | null;
  companies: SupabaseRelation<RelatedCompany>;
  contacts: SupabaseRelation<RelatedContact>;
  assigned_profile: SupabaseRelation<AssignedProfile>;
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export default async function TasksPage() {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      due_date,
      priority,
      status,
      assigned_to,
      company_id,
      contact_id,
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
      assigned_profile:profiles!tasks_assigned_to_fkey (
        id,
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  const tasks = (data ?? []) as unknown as Task[];

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
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Tasks</h1>

          <p style={{ color: "#aaa" }}>
            Follow-ups and work items connected to this Sell It workspace.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "12px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Home
          </Link>

          <Link
            href="/tasks/new"
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "12px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Add Task
          </Link>
        </div>
      </div>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && tasks.length === 0 && <p>No tasks found.</p>}

      {tasks.map((task) => {
        const company = singleRelation(task.companies);
        const contact = singleRelation(task.contacts);
        const assignedProfile = singleRelation(task.assigned_profile);

        return (
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
            }}
          >
            <h2 style={{ marginTop: 0 }}>{task.title}</h2>

            <p>Status: {task.status}</p>
            <p>Priority: {task.priority}</p>

            {task.due_date && <p>Due: {task.due_date}</p>}

            {(assignedProfile?.full_name || assignedProfile?.email) && (
              <p>
                Assigned To:{" "}
                {assignedProfile.full_name || assignedProfile.email}
              </p>
            )}

            {company?.name && <p>Company: {company.name}</p>}

            {contact && (
              <p>
                Contact: {contact.first_name} {contact.last_name || ""}
              </p>
            )}
          </Link>
        );
      })}
    </main>
  );
}