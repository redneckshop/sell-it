import { businessTodayKey, dateKeyToLocalDate, dateOnlyKey, formatDateOnly } from "../lib/dateUtils";
import Link from "next/link";
import type { CSSProperties } from "react";
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
  assigned_team_member_id: string | null;
  assigned_profile: SupabaseRelation<AssignedProfile>;
  assigned_team_member: SupabaseRelation<AssignedTeamMember>;
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

function assignedTeamMemberLabel(
  teamMember: AssignedTeamMember | null,
  profile: AssignedProfile | null
) {
  return (
    teamMember?.display_name ||
    teamMember?.email ||
    profile?.full_name ||
    profile?.email ||
    ""
  );
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
    new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function todayDateOnly() {
  return dateKeyToLocalDate(businessTodayKey()) ?? new Date();
}

function parseTaskDate(value: string | null) {
  const key = dateOnlyKey(value);

  if (!key) return null;

  return dateKeyToLocalDate(key);
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

function formatDate(value: string | null) {
  return formatDateOnly(value);
}

function getDueStatus(task: Task) {
  const dueDate = parseTaskDate(task.due_date);

  if (!dueDate) {
    return "No due date";
  }

  const today = todayDateOnly();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dueDate < today && task.status !== "Completed") {
    return "Overdue";
  }

  if (dueDate >= today && dueDate < tomorrow) {
    return "Due Today";
  }

  return formatDate(task.due_date);
}

function initialsFromTask(title: string) {
  const parts = title
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function contactName(contact: RelatedContact | null) {
  if (!contact) return "Not linked";

  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function pageStyle(): CSSProperties {
  return {
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#101010",
    color: "white",
    padding: "38px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  };
}

function panelStyle(): CSSProperties {
  return {
    border: "1px solid #2f2f2f",
    background:
      "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
    padding: "16px",
    borderRadius: "14px",
    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
  };
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #3d3d3d",
    backgroundColor: "#111",
    color: "white",
    outline: "none",
  };
}

function fieldLabelStyle(): CSSProperties {
  return {
    display: "block",
    marginBottom: "7px",
    color: "#e5e5e5",
    fontSize: "13px",
    fontWeight: 800,
  };
}

function primaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    backgroundColor: "#7c3aed",
    color: "white",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #8b5cf6",
    boxShadow: "0 12px 24px rgba(124,58,237,0.24)",
  };
}

function secondaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    color: "white",
    border: "1px solid #3d3d3d",
    backgroundColor: "#151515",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
  };
}

function badgeStyle(value: string | null): CSSProperties {
  const normalized = (value ?? "").toLowerCase();

  const backgroundColor =
    normalized === "urgent" || normalized === "high" || normalized === "overdue"
      ? "rgba(239, 68, 68, 0.22)"
      : normalized === "normal" || normalized === "open"
        ? "rgba(59, 130, 246, 0.22)"
        : normalized === "completed"
          ? "rgba(34, 197, 94, 0.22)"
          : normalized === "in progress" || normalized === "due today"
            ? "rgba(124, 58, 237, 0.22)"
            : normalized === "low"
              ? "rgba(156, 163, 175, 0.18)"
              : "rgba(156, 163, 175, 0.18)";

  const color =
    normalized === "urgent" || normalized === "high" || normalized === "overdue"
      ? "#fca5a5"
      : normalized === "normal" || normalized === "open"
        ? "#93c5fd"
        : normalized === "completed"
          ? "#86efac"
          : normalized === "in progress" || normalized === "due today"
            ? "#c4b5fd"
            : "#d1d5db";

  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor,
    color,
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
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
      assigned_team_member_id,
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
      ),
      assigned_team_member:team_members!tasks_assigned_team_member_id_fkey (
        id,
        profile_id,
        display_name,
        email,
        role_title,
        status
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
    <main style={pageStyle()}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "22px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                ...mutedTextStyle(),
                textTransform: "uppercase",
                letterSpacing: "1.8px",
                fontSize: "12px",
                fontWeight: 900,
                margin: "0 0 8px",
              }}
            >
              Sales
            </p>

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>Tasks</h1>

            <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.5 }}>
              Follow-ups, reminders, assignments, and sales actions.
            </p>
          </div>

          <Link href="/tasks/new" style={primaryButtonStyle()}>
            + Add Task
          </Link>
        </div>

        <form action="/tasks" style={{ ...panelStyle(), marginBottom: "18px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <label>
              <span style={fieldLabelStyle()}>Search</span>
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search tasks..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Status</span>
              <select name="status" defaultValue={statusFilter} style={inputStyle()}>
                <option value="">All</option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={fieldLabelStyle()}>Priority</span>
              <select
                name="priority"
                defaultValue={priorityFilter}
                style={inputStyle()}
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
              <span style={fieldLabelStyle()}>Due</span>
              <select name="due" defaultValue={dueFilter} style={inputStyle()}>
                <option value="">All</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="this_week">Due This Week</option>
              </select>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px",
            }}
          >
            <button
              type="submit"
              style={{
                ...primaryButtonStyle(),
                cursor: "pointer",
              }}
            >
              Apply Filters
            </button>

            <a href="/tasks" style={secondaryButtonStyle()}>
              Clear Filters
            </a>
          </div>
        </form>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <p style={{ ...mutedTextStyle(), margin: 0 }}>{resultCountLabel}</p>

          <p style={{ ...mutedTextStyle(), margin: 0, fontSize: "13px" }}>
            Sorted by newest first
          </p>
        </div>

        {error && (
          <p style={{ color: "red" }}>Database error: {error.message}</p>
        )}

        {!error && allTasks.length === 0 && <p>No tasks found.</p>}

        {!error && allTasks.length > 0 && tasks.length === 0 && (
          <p>No tasks match the current filters.</p>
        )}

        <div style={{ display: "grid", gap: "10px" }}>
          {tasks.map((task) => {
            const company = singleRelation(task.companies);
            const contact = singleRelation(task.contacts);
            const assignedProfile = singleRelation(task.assigned_profile);
            const assignedTeamMember = singleRelation(task.assigned_team_member);
            const assignedLabel = assignedTeamMemberLabel(
              assignedTeamMember,
              assignedProfile
            );
            const dueStatus = getDueStatus(task);

            return (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "48px minmax(0, 1.25fr) minmax(190px, 0.85fr) 26px",
                  gap: "14px",
                  alignItems: "center",
                  border: "1px solid #2f2f2f",
                  padding: "14px",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
                  color: "white",
                  textDecoration: "none",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#2b2b2b",
                    color: "white",
                    fontWeight: 900,
                    border: "1px solid #3d3d3d",
                  }}
                >
                  {initialsFromTask(task.title)}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginBottom: "5px",
                    }}
                  >
                    <strong>{task.title}</strong>

                    <span style={badgeStyle(task.status)}>{task.status}</span>

                    <span style={badgeStyle(task.priority)}>
                      {task.priority}
                    </span>

                    <span style={badgeStyle(dueStatus)}>{dueStatus}</span>
                  </div>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 4px" }}>
                    Company: {company?.name || "Not linked"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: 0 }}>
                    Contact: {contactName(contact)}
                  </p>

                  {task.description && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {task.description.length > 140
                        ? `${task.description.slice(0, 140)}...`
                        : task.description}
                    </p>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Due: {task.due_date ? formatDate(task.due_date) : "No due date"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Assigned To: {assignedLabel || "Unassigned"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: 0 }}>
                    Created:{" "}
                    {task.created_at
                      ? new Date(task.created_at).toLocaleDateString()
                      : "Not available"}
                  </p>
                </div>

                <div
                  style={{
                    color: "#a7a7a7",
                    fontSize: "26px",
                    textAlign: "right",
                  }}
                >
                  ›
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}




