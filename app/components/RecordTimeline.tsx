import Link from "next/link";
import type { CSSProperties } from "react";

export type TimelineEvent = {
  id: string;
  title: string;
  occurredAt: string | null;
  category?: string;
  description?: string | null;
  href?: string;
  meta?: string[];
};

type RecordTimelineProps = {
  title?: string;
  subtitle?: string;
  events: TimelineEvent[];
  emptyMessage?: string;
  maxWidth?: string;
};

const wrapperStyle: CSSProperties = {
  border: "1px solid #333",
  backgroundColor: "#1a1a1a",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "28px",
};

const eventStyle: CSSProperties = {
  border: "1px solid #333",
  backgroundColor: "#111",
  borderRadius: "8px",
  padding: "14px",
  marginTop: "12px",
};

const eventHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "8px",
};

const pillStyle: CSSProperties = {
  border: "1px solid #444",
  borderRadius: "999px",
  padding: "3px 9px",
  color: "#ccc",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const dateStyle: CSSProperties = {
  color: "#aaa",
  fontSize: "13px",
};

function getTimeValue(value: string | null) {
  if (!value) return 0;

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 0;

  return parsed;
}

function formatDateTime(value: string | null) {
  if (!value) return "No date";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function dedupeAndSortEvents(events: TimelineEvent[]) {
  const seen = new Set<string>();

  return events
    .filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .sort((a, b) => getTimeValue(b.occurredAt) - getTimeValue(a.occurredAt));
}

export default function RecordTimeline({
  title = "Timeline",
  subtitle,
  events,
  emptyMessage = "No timeline events found yet.",
  maxWidth = "1000px",
}: RecordTimelineProps) {
  const sortedEvents = dedupeAndSortEvents(events);

  return (
    <section style={{ ...wrapperStyle, maxWidth }}>
      <h2 style={{ marginTop: 0, marginBottom: "6px" }}>{title}</h2>

      {subtitle && (
        <p style={{ color: "#aaa", marginTop: 0, marginBottom: "14px" }}>
          {subtitle}
        </p>
      )}

      {sortedEvents.length === 0 && (
        <p style={{ color: "#aaa", marginBottom: 0 }}>{emptyMessage}</p>
      )}

      {sortedEvents.map((event) => (
        <article key={event.id} style={eventStyle}>
          <div style={eventHeaderStyle}>
            <div>
              {event.category && <span style={pillStyle}>{event.category}</span>}
            </div>

            <div style={dateStyle}>{formatDateTime(event.occurredAt)}</div>
          </div>

          <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
            {event.href ? (
              <Link href={event.href} style={{ color: "white" }}>
                {event.title}
              </Link>
            ) : (
              event.title
            )}
          </h3>

          {event.description && (
            <p
              style={{
                color: "#ddd",
                whiteSpace: "pre-wrap",
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              {event.description}
            </p>
          )}

          {event.meta && event.meta.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                color: "#aaa",
                fontSize: "13px",
              }}
            >
              {event.meta.map((item) => (
                <span key={item} style={pillStyle}>
                  {item}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
