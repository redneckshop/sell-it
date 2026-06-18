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
  created_at: string | null;
  company_id: string | null;
  contact_id: string | null;
  companies: SupabaseRelation<RelatedCompany>;
  contacts: SupabaseRelation<RelatedContact>;
  assigned_profile: SupabaseRelation<AssignedProfile>;
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    due?: string;
  }>;
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function textValue(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function matchesTaskSearch(task: Task, search: string) {
  if (!search) return true;

  const company = singleRelation(task.companies);
  const contact = singleRelation(task.contacts);

  const searchable = [
    task.title,
    task.description,
    task.status,
    task.priority,
    company?.name,
    contact?.first_name,
    contact?.last_name,
  ]
    .map((value) => textValue(value))
    .join(" ");

  return searchable.includes(search);
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function todayDateOnly() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseTaskDate(value: string | null) {
  if (!value) return null;

  const parts = value.split("-").map((part) => Number(part));

  if (parts.length >= 3 && parts.every((part) => Number.isFinite(part))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function matchesDueFilter(task: Task, dueFilter: string) {
  if (!dueFilter) return true;

  const dueDate = parseTaskDate(task.due_date);

  if (!dueDate) return false;

  const today = todayDateOnly();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  if (dueFilter === "overdue") {
    return dueDate < today;
  }

  if (dueFilter === "today") {
    return dueDate >= today && dueDate < tomorrow;
  }

  if (dueFilter === "this_week") {
    return dueDate >= today && dueDate <= weekEnd;
  }

  return true;
}

function dueFilterLabel(value: string) {
  if (value === "overdue") return "overdue";
  if (value === "today") return "due today";
  if (value === "this_week") return "due this week";

  return "tasks";
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const search = (params.q ?? "").trim().toLowerCase();
  const statusFilter = (params.status ?? "").trim();
  const priorityFilter = (params.priority ?? "").trim();
  const dueFilter = (params.due ?? "").trim();

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      due_date,
      priority,
      status,
      created_at,
      company_id,
      contact_id,
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

  const allTasks = (data ?? []) as unknown as Task[];

  const tasks = allTasks.filter((task) => {
    return (
      matchesTaskSearch(task, search) &&
      (!statusFilter || task.status === statusFilter) &&
      (!priorityFilter || task.priority === priorityFilter) &&
      matchesDueFilter(task, dueFilter)
    );
  });

  const statuses = uniqueValues(allTasks.map((task) => task.status));
  const priorities = uniqueValues(allTasks.map((task) => task.priority));

  const hasFilters =
    Boolean(search) ||
    Boolean(statusFilter) ||
    Boolean(priorityFilter) ||
    Boolean(dueFilter);

  const resultCountLabel = dueFilter
    ? `Showing ${tasks.length} ${dueFilterLabel(
        dueFilter
      )} tasks out of ${allTasks.length} total tasks${
        hasFilters ? " with current filters" : ""
      }`
    : `Showing ${tasks.length} tasks out of ${allTasks.length} total tasks${
        hasFilters ? " with current filters" : ""
      }`;

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
            Follow-ups, reminders, assignments, and sales actions.
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

      <form
        action="/tasks"
        style={{
          border: "1px solid #333",
          backgroundColor: "#181818",
          padding: "16px",
          borderRadius: "10px",
          marginBottom: "18px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Search
            </span>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Keyword"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Status
            </span>
            <select
              name="status"
              defaultValue={statusFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Priority
            </span>
            <select
              name="priority"
              defaultValue={priorityFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              {priorities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Due
            </span>
            <select
              name="due"
              defaultValue={dueFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="this_week">Due This Week</option>
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#f5d76e",
              color: "black",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>

          <a
            href="/tasks"
            style={{
              color: "white",
              border: "1px solid #555",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Clear Filters
          </a>
        </div>
      </form>

      <p style={{ color: "#aaa", marginBottom: "18px" }}>
        {resultCountLabel}
      </p>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && allTasks.length === 0 && <p>No tasks found.</p>}

      {!error && allTasks.length > 0 && tasks.length === 0 && (
        <p>No tasks match the current filters.</p>
      )}

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

            {task.description && (
              <p style={{ color: "#aaa" }}>
                {task.description.length > 180
                  ? `${task.description.slice(0, 180)}...`
                  : task.description}
              </p>
            )}
          </Link>
        );
      })}
    </main>
  );
}
