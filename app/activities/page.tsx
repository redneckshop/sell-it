import Link from "next/link";
import { supabase } from "../lib/supabase";

type RelatedCompany = {
  id: string;
  name: string;
};

type RelatedContact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type RelatedTask = {
  id: string;
  title: string;
};

type SupabaseRelation<T> = T | T[] | null;

type Activity = {
  id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  summary: string | null;
  outcome: string | null;
  follow_up_needed: boolean;
  company_id: string | null;
  contact_id: string | null;
  task_id: string | null;
  created_at: string | null;
  companies: SupabaseRelation<RelatedCompany>;
  contacts: SupabaseRelation<RelatedContact>;
  tasks: SupabaseRelation<RelatedTask>;
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    activity_type?: string;
    outcome?: string;
    follow_up?: string;
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

function matchesActivitySearch(activity: Activity, search: string) {
  if (!search) return true;

  const company = singleRelation(activity.companies);
  const contact = singleRelation(activity.contacts);
  const task = singleRelation(activity.tasks);

  const searchable = [
    activity.subject,
    activity.summary,
    activity.activity_type,
    activity.outcome,
    company?.name,
    contact?.first_name,
    contact?.last_name,
    task?.title,
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

const STANDARD_ACTIVITY_TYPES = [
  "Call",
  "Voicemail",
  "Text Message",
  "Email",
  "Meeting",
  "Lunch",
  "Website Research",
  "Facebook Comment",
  "Facebook Message",
  "Note",
  "Other",
];

const STANDARD_ACTIVITY_OUTCOMES = [
  "No Answer",
  "Left Voicemail",
  "Spoke",
  "Texted",
  "Interested",
  "Not Interested",
  "Meeting Booked",
  "Follow-Up Needed",
  "Converted",
  "Bad Fit",
];

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const search = (params.q ?? "").trim().toLowerCase();
  const activityTypeFilter = (params.activity_type ?? "").trim();
  const outcomeFilter = (params.outcome ?? "").trim();
  const followUpFilter = (params.follow_up ?? "").trim();

  const { data, error } = await supabase
    .from("activities")
    .select(`
      id,
      activity_type,
      activity_date,
      subject,
      summary,
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
    .order("activity_date", { ascending: false });

  const allActivities = (data ?? []) as unknown as Activity[];

  const activities = allActivities.filter((activity) => {
    const matchesFollowUp =
      followUpFilter === "yes"
        ? activity.follow_up_needed
        : followUpFilter === "no"
          ? !activity.follow_up_needed
          : true;

    return (
      matchesActivitySearch(activity, search) &&
      (!activityTypeFilter || activity.activity_type === activityTypeFilter) &&
      (!outcomeFilter || activity.outcome === outcomeFilter) &&
      matchesFollowUp
    );
  });

  const activityTypes = uniqueValues([
    ...STANDARD_ACTIVITY_TYPES,
    ...allActivities.map((activity) => activity.activity_type),
  ]);

  const outcomes = uniqueValues([
    ...STANDARD_ACTIVITY_OUTCOMES,
    ...allActivities.map((activity) => activity.outcome),
  ]);

  const hasFilters =
    Boolean(search) ||
    Boolean(activityTypeFilter) ||
    Boolean(outcomeFilter) ||
    Boolean(followUpFilter);

  const resultCountLabel = `Showing ${activities.length} activities out of ${allActivities.length} total activities${
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
          <h1>Activities</h1>

          <p style={{ color: "#aaa" }}>
            Sales conversations, notes, calls, meetings, messages, and research.
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
            href="/activities/new"
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "12px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Add Activity
          </Link>
        </div>
      </div>

      <form
        action="/activities"
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
              Activity Type
            </span>
            <select
              name="activity_type"
              defaultValue={activityTypeFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              {activityTypes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Outcome
            </span>
            <select
              name="outcome"
              defaultValue={outcomeFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              {outcomes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Follow-Up Needed
            </span>
            <select
              name="follow_up"
              defaultValue={followUpFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              <option value="yes">Yes only</option>
              <option value="no">No only</option>
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
            href="/activities"
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

      {!error && allActivities.length === 0 && <p>No activities found.</p>}

      {!error && allActivities.length > 0 && activities.length === 0 && (
        <p>No activities match the current filters.</p>
      )}

      {activities.map((activity) => {
        const company = singleRelation(activity.companies);
        const contact = singleRelation(activity.contacts);
        const task = singleRelation(activity.tasks);

        return (
          <Link
            key={activity.id}
            href={`/activities/${activity.id}`}
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
            <h2 style={{ marginTop: 0 }}>{activity.subject}</h2>

            <p>Type: {activity.activity_type}</p>
            <p>Date: {formatDateTime(activity.activity_date)}</p>

            {activity.outcome && <p>Outcome: {activity.outcome}</p>}

            {activity.follow_up_needed && (
              <p style={{ fontWeight: "bold" }}>Follow Up Needed</p>
            )}

            {company?.name && <p>Company: {company.name}</p>}

            {contact && (
              <p>
                Contact: {contact.first_name} {contact.last_name || ""}
              </p>
            )}

            {task?.title && <p>Task: {task.title}</p>}

            {activity.summary && <p>Summary: {activity.summary}</p>}
          </Link>
        );
      })}
    </main>
  );
}
