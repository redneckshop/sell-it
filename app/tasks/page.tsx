import Link from "next/link";
import { supabase } from "../lib/supabase";

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
  companies: {
    id: string;
    name: string;
  } | null;
  contacts: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
  assigned_profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

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

  const tasks: Task[] = data ?? [];

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
          <h1>Tasks</h1>

          <p style={{ color: "#aaa" }}>
            Follow-ups and work items connected to this Sell It workspace.
          </p>
        </div>

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

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && tasks.length === 0 && <p>No tasks found.</p>}

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
          }}
        >
          <h2 style={{ marginTop: 0 }}>{task.title}</h2>

          <p>Status: {task.status}</p>
          <p>Priority: {task.priority}</p>

          {task.due_date && <p>Due: {task.due_date}</p>}

          {task.assigned_profile?.full_name && (
            <p>Assigned To: {task.assigned_profile.full_name}</p>
          )}

          {task.companies?.name && <p>Company: {task.companies.name}</p>}

          {task.contacts && (
            <p>
              Contact: {task.contacts.first_name}{" "}
              {task.contacts.last_name || ""}
            </p>
          )}
        </Link>
      ))}
    </main>
  );
}