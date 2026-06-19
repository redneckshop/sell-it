import Link from "next/link";
import type { CSSProperties } from "react";
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
    new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))
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

function initialsFromSubject(subject: string) {
  const parts = subject
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
    normalized.includes("follow") || normalized === "interested"
      ? "rgba(124, 58, 237, 0.22)"
      : normalized === "converted"
        ? "rgba(34, 197, 94, 0.22)"
        : normalized === "bad fit" || normalized === "not interested"
          ? "rgba(239, 68, 68, 0.18)"
          : normalized === "email" || normalized === "text message"
            ? "rgba(59, 130, 246, 0.22)"
            : normalized === "call" || normalized === "meeting"
              ? "rgba(34, 197, 94, 0.18)"
              : "rgba(156, 163, 175, 0.18)";

  const color =
    normalized.includes("follow") || normalized === "interested"
      ? "#c4b5fd"
      : normalized === "converted"
        ? "#86efac"
        : normalized === "bad fit" || normalized === "not interested"
          ? "#fca5a5"
          : normalized === "email" || normalized === "text message"
            ? "#93c5fd"
            : normalized === "call" || normalized === "meeting"
              ? "#86efac"
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

function followUpBadgeStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor: "rgba(245, 158, 11, 0.22)",
    color: "#fcd34d",
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
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

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>Activities</h1>

            <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.5 }}>
              Sales conversations, notes, calls, meetings, messages, and research.
            </p>
          </div>

          <Link href="/activities/new" style={primaryButtonStyle()}>
            + Add Activity
          </Link>
        </div>

        <form
          action="/activities"
          style={{ ...panelStyle(), marginBottom: "18px" }}
        >
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
                placeholder="Search activities..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Activity Type</span>
              <select
                name="activity_type"
                defaultValue={activityTypeFilter}
                style={inputStyle()}
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
              <span style={fieldLabelStyle()}>Outcome</span>
              <select
                name="outcome"
                defaultValue={outcomeFilter}
                style={inputStyle()}
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
              <span style={fieldLabelStyle()}>Follow-Up Needed</span>
              <select
                name="follow_up"
                defaultValue={followUpFilter}
                style={inputStyle()}
              >
                <option value="">All</option>
                <option value="yes">Yes only</option>
                <option value="no">No only</option>
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

            <a href="/activities" style={secondaryButtonStyle()}>
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
            Sorted by activity date
          </p>
        </div>

        {error && (
          <p style={{ color: "red" }}>Database error: {error.message}</p>
        )}

        {!error && allActivities.length === 0 && <p>No activities found.</p>}

        {!error && allActivities.length > 0 && activities.length === 0 && (
          <p>No activities match the current filters.</p>
        )}

        <div style={{ display: "grid", gap: "10px" }}>
          {activities.map((activity) => {
            const company = singleRelation(activity.companies);
            const contact = singleRelation(activity.contacts);
            const task = singleRelation(activity.tasks);

            return (
              <Link
                key={activity.id}
                href={`/activities/${activity.id}`}
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
                  {initialsFromSubject(activity.subject)}
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
                    <strong>{activity.subject}</strong>

                    <span style={badgeStyle(activity.activity_type)}>
                      {activity.activity_type}
                    </span>

                    {activity.outcome && (
                      <span style={badgeStyle(activity.outcome)}>
                        {activity.outcome}
                      </span>
                    )}

                    {activity.follow_up_needed && (
                      <span style={followUpBadgeStyle()}>Follow Up Needed</span>
                    )}
                  </div>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 4px" }}>
                    Company: {company?.name || "Not linked"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 4px" }}>
                    Contact: {contactName(contact)}
                  </p>

                  {activity.summary && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      Summary:{" "}
                      {activity.summary.length > 140
                        ? `${activity.summary.slice(0, 140)}...`
                        : activity.summary}
                    </p>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Date: {formatDateTime(activity.activity_date)}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Task: {task?.title || "Not linked"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: 0 }}>
                    Follow-Up: {activity.follow_up_needed ? "Yes" : "No"}
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
