"use client";
import { formatDateTimeLocal } from "../lib/dateUtils";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import { formatWorkLogAction, getWorkLogEntityHref } from "../lib/workLog";

type WorkLogEntry = {
  id: string;
  created_at: string;
  actor_type: string;
  actor_display_name: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  summary: string;
  details: string | null;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "1280px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "22px",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
};

const subtitleStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#cbd5e1",
  fontSize: "15px",
  lineHeight: 1.55,
  maxWidth: "850px",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: "22px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
  marginBottom: "18px",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "14px",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "#e2e8f0",
  fontSize: "13px",
  fontWeight: 900,
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "11px 12px",
  marginTop: "8px",
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "14px",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
};

const tableWrapStyle: CSSProperties = {
  overflowX: "auto",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: "18px",
  backgroundColor: "rgba(15, 23, 42, 0.42)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "1050px",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
  padding: "12px",
  color: "#cbd5e1",
  fontSize: "12px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const tdStyle: CSSProperties = {
  borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
  padding: "12px",
  verticalAlign: "top",
  color: "#e2e8f0",
  fontSize: "14px",
};

const mutedTextStyle: CSSProperties = {
  color: "#94a3b8",
};

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 900,
  textDecoration: "none",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.32)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "12px 14px",
  borderRadius: "16px",
  marginBottom: "18px",
  fontWeight: 800,
};

function formatDateTime(value: string | null) {
  return formatDateTimeLocal(value);
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value || "").filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function includesText(value: string | null | undefined, search: string) {
  return (value || "").toLowerCase().includes(search.toLowerCase());
}

function getActorLabel(entry: WorkLogEntry) {
  return entry.actor_display_name || entry.actor_type || "Unknown";
}

function renderRecordLink(entry: WorkLogEntry) {
  const href = getWorkLogEntityHref(entry.entity_type, entry.entity_id);

  if (!href) {
    return entry.entity_label || entry.entity_id || "—";
  }

  return (
    <Link href={href} style={linkStyle}>
      {entry.entity_label || entry.entity_id}
    </Link>
  );
}

function renderRelatedLink(entry: WorkLogEntry) {
  const href = getWorkLogEntityHref(
    entry.related_entity_type,
    entry.related_entity_id
  );

  if (!href) {
    return null;
  }

  return (
    <Link href={href} style={linkStyle}>
      Related record
    </Link>
  );
}

export default function WorkLogPage() {
  const [entries, setEntries] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actionType, setActionType] = useState("");
  const [actor, setActor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("work_log")
        .select(
          "id, created_at, actor_type, actor_display_name, action_type, entity_type, entity_id, entity_label, related_entity_type, related_entity_id, summary, details"
        )
        .order("created_at", { ascending: false })
        .limit(500);

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setEntries((data ?? []) as WorkLogEntry[]);
    }

    loadEntries();
  }, []);

  const entityTypes = useMemo(
    () => uniqueSorted(entries.map((entry) => entry.entity_type)),
    [entries]
  );

  const actionTypes = useMemo(
    () => uniqueSorted(entries.map((entry) => entry.action_type)),
    [entries]
  );

  const actors = useMemo(
    () => uniqueSorted(entries.map((entry) => getActorLabel(entry))),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const actorLabel = getActorLabel(entry);
      const searchMatches =
        !searchText ||
        includesText(entry.summary, searchText) ||
        includesText(entry.entity_label, searchText) ||
        includesText(entry.details, searchText) ||
        includesText(actorLabel, searchText);

      const entityMatches = !entityType || entry.entity_type === entityType;
      const actionMatches = !actionType || entry.action_type === actionType;
      const actorMatches = !actor || actorLabel === actor;

      const entryDate = new Date(entry.created_at);

      const startsAfter =
        !startDate || entryDate >= new Date(`${startDate}T00:00:00`);
      const endsBefore =
        !endDate || entryDate <= new Date(`${endDate}T23:59:59`);

      return (
        searchMatches &&
        entityMatches &&
        actionMatches &&
        actorMatches &&
        startsAfter &&
        endsBefore
      );
    });
  }, [entries, searchText, entityType, actionType, actor, startDate, endDate]);

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Management / Permanent History</p>
            <h1 style={titleStyle}>Work Log</h1>
            <p style={subtitleStyle}>
              Permanent history for important Sell It actions. Notification
              Center is the attention feed. Work Log is the long-term record.
            </p>
          </div>
        </div>

        <section style={cardStyle}>
          <p style={eyebrowStyle}>Filters</p>

          <div style={filterGridStyle}>
            <label style={labelStyle}>
              Search
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search summary, actor, or record"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Entity Type
              <select
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
                style={inputStyle}
              >
                <option value="">All entities</option>
                {entityTypes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Action Type
              <select
                value={actionType}
                onChange={(event) => setActionType(event.target.value)}
                style={inputStyle}
              >
                <option value="">All actions</option>
                {actionTypes.map((value) => (
                  <option key={value} value={value}>
                    {formatWorkLogAction(value)}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Actor
              <select
                value={actor}
                onChange={(event) => setActor(event.target.value)}
                style={inputStyle}
              >
                <option value="">All actors</option>
                {actors.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Start Date
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              End Date
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                style={inputStyle}
              />
            </label>
          </div>
        </section>

        {errorMessage && (
          <p style={errorStyle}>
            Error: {errorMessage}
          </p>
        )}

        <section style={cardStyle}>
          <p style={eyebrowStyle}>Entries</p>
          <h2 style={{ marginTop: 0 }}>
            {loading
              ? "Loading Work Log..."
              : `${filteredEntries.length} shown / ${entries.length} loaded`}
          </h2>

          {!loading && filteredEntries.length === 0 && (
            <p style={mutedTextStyle}>
              No Work Log entries match the current filters.
            </p>
          )}

          {filteredEntries.length > 0 && (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date / Time</th>
                    <th style={thStyle}>Actor</th>
                    <th style={thStyle}>Action</th>
                    <th style={thStyle}>Entity Type</th>
                    <th style={thStyle}>Entity</th>
                    <th style={thStyle}>Summary</th>
                    <th style={thStyle}>Related</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td style={tdStyle}>{formatDateTime(entry.created_at)}</td>
                      <td style={tdStyle}>{getActorLabel(entry)}</td>
                      <td style={tdStyle}>
                        {formatWorkLogAction(entry.action_type)}
                      </td>
                      <td style={tdStyle}>{entry.entity_type}</td>
                      <td style={tdStyle}>{renderRecordLink(entry)}</td>
                      <td style={tdStyle}>
                        <div>{entry.summary}</div>
                        {entry.details && (
                          <div style={{ ...mutedTextStyle, marginTop: "6px" }}>
                            {entry.details}
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>{renderRelatedLink(entry) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}


