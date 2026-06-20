"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type Opportunity = {
  id: string;
  name: string;
  opportunity_type: string | null;
  stage: string | null;
  lead_temperature: string | null;
  company_id: string | null;
  primary_contact_id: string | null;
  created_at: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  opportunity_id: string | null;
};

type Activity = {
  id: string;
  subject: string;
  activity_type: string | null;
  activity_date: string | null;
  outcome: string | null;
  opportunity_id: string | null;
};

type Note = {
  id: string;
  title: string;
  source: string | null;
  tags: string | null;
  created_at: string | null;
  opportunity_id: string | null;
};

type Attachment = {
  id: string;
  file_name: string;
  file_type: string | null;
  related_opportunity_id: string | null;
  created_at: string | null;
};

type DeleteType = "opportunity" | "task" | "activity" | "note" | "attachment";
type SelectedMap = Record<string, boolean>;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const secondaryButtonStyle: CSSProperties = {
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  color: "#fecaca",
  background: "rgba(127, 29, 29, 0.24)",
  border: "1px solid rgba(248, 113, 113, 0.35)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
};

const disabledDangerButtonStyle: CSSProperties = {
  ...dangerButtonStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const headerStyle: CSSProperties = {
  maxWidth: "1080px",
  marginBottom: "24px",
  border: "1px solid rgba(248, 113, 113, 0.24)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(239, 68, 68, 0.18), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#fca5a5",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "34px",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  maxWidth: "900px",
  lineHeight: 1.65,
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  marginBottom: "16px",
  maxWidth: "1080px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.22)",
};

const warningCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(245, 158, 11, 0.36)",
  background:
    "linear-gradient(180deg, rgba(120, 53, 15, 0.35), rgba(15, 23, 42, 0.72))",
};

const dangerCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(248, 113, 113, 0.4)",
  background:
    "linear-gradient(180deg, rgba(127, 29, 29, 0.34), rgba(15, 23, 42, 0.72))",
};

const successCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(74, 222, 128, 0.34)",
  background:
    "linear-gradient(180deg, rgba(20, 83, 45, 0.28), rgba(15, 23, 42, 0.72))",
};

const checkboxRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: "12px",
  alignItems: "flex-start",
  padding: "12px",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "1080px",
  fontWeight: 800,
};

const emptyTextStyle: CSSProperties = {
  color: "#94a3b8",
};

function recordKey(type: DeleteType, id: string) {
  return `${type}:${id}`;
}

function countSelected(selected: SelectedMap) {
  return Object.values(selected).filter(Boolean).length;
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function DeleteOpportunityPage() {
  const params = useParams<{ id: string }>();
  const opportunityId = params.id;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});

  const allKeys = useMemo(() => {
    const keys: string[] = [];

    if (opportunity) keys.push(recordKey("opportunity", opportunity.id));
    tasks.forEach((row) => keys.push(recordKey("task", row.id)));
    activities.forEach((row) => keys.push(recordKey("activity", row.id)));
    notes.forEach((row) => keys.push(recordKey("note", row.id)));
    attachments.forEach((row) => keys.push(recordKey("attachment", row.id)));

    return keys;
  }, [opportunity, tasks, activities, notes, attachments]);

  const selectedCount = countSelected(selected);

  useEffect(() => {
    async function loadDeleteReview() {
      setLoading(true);
      setErrorMessage("");

      const { data: opportunityRow, error: opportunityError } = await supabase
        .from("opportunities")
        .select(
          "id, name, opportunity_type, stage, lead_temperature, company_id, primary_contact_id, created_at"
        )
        .eq("id", opportunityId)
        .single();

      if (opportunityError) {
        setErrorMessage(opportunityError.message);
        setLoading(false);
        return;
      }

      const taskResult = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, opportunity_id")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });

      if (taskResult.error) {
        setErrorMessage(taskResult.error.message);
        setLoading(false);
        return;
      }

      const activityResult = await supabase
        .from("activities")
        .select("id, subject, activity_type, activity_date, outcome, opportunity_id")
        .eq("opportunity_id", opportunityId)
        .order("activity_date", { ascending: false });

      if (activityResult.error) {
        setErrorMessage(activityResult.error.message);
        setLoading(false);
        return;
      }

      const noteResult = await supabase
        .from("notes")
        .select("id, title, source, tags, created_at, opportunity_id")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });

      if (noteResult.error) {
        setErrorMessage(noteResult.error.message);
        setLoading(false);
        return;
      }

      const attachmentResult = await supabase
        .from("attachments")
        .select("id, file_name, file_type, related_opportunity_id, created_at")
        .eq("related_opportunity_id", opportunityId)
        .order("created_at", { ascending: false });

      if (attachmentResult.error) {
        setErrorMessage(attachmentResult.error.message);
        setLoading(false);
        return;
      }

      const loadedOpportunity = opportunityRow as Opportunity;

      setOpportunity(loadedOpportunity);
      setTasks((taskResult.data ?? []) as Task[]);
      setActivities((activityResult.data ?? []) as Activity[]);
      setNotes((noteResult.data ?? []) as Note[]);
      setAttachments((attachmentResult.data ?? []) as Attachment[]);
      setSelected({
        [recordKey("opportunity", loadedOpportunity.id)]: true,
      });

      setLoading(false);
    }

    loadDeleteReview();
  }, [opportunityId]);

  function isChecked(type: DeleteType, id: string) {
    return Boolean(selected[recordKey(type, id)]);
  }

  function toggleSelected(type: DeleteType, id: string) {
    const key = recordKey(type, id);

    setSelected((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function selectAll() {
    const next: SelectedMap = {};
    allKeys.forEach((key) => {
      next[key] = true;
    });
    setSelected(next);
  }

  function unselectAll() {
    setSelected({});
  }

  function idsFor<T extends { id: string }>(type: DeleteType, rows: T[]) {
    return rows.filter((row) => isChecked(type, row.id)).map((row) => row.id);
  }

  async function deleteIds(table: string, ids: string[]) {
    if (ids.length === 0) return;

    const { error } = await supabase.from(table).delete().in("id", ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function detachIds(table: string, column: string, ids: string[]) {
    if (ids.length === 0) return;

    const { error } = await supabase
      .from(table)
      .update({ [column]: null })
      .in("id", ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function detachWhereColumnMatches(
    table: string,
    column: string,
    ids: string[]
  ) {
    if (ids.length === 0) return;

    const { error } = await supabase
      .from(table)
      .update({ [column]: null })
      .in(column, ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function handleDeleteSelected() {
    if (!opportunity || selectedCount === 0) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const opportunitySelected = isChecked("opportunity", opportunity.id);

      const selectedTaskIds = idsFor("task", tasks);
      const selectedActivityIds = idsFor("activity", activities);
      const selectedNoteIds = idsFor("note", notes);
      const selectedAttachmentIds = idsFor("attachment", attachments);

      await deleteIds("attachments", selectedAttachmentIds);

      await detachWhereColumnMatches("attachments", "related_task_id", selectedTaskIds);
      await detachWhereColumnMatches(
        "attachments",
        "related_activity_id",
        selectedActivityIds
      );
      await detachWhereColumnMatches("attachments", "related_note_id", selectedNoteIds);

      await deleteIds("notes", selectedNoteIds);
      await deleteIds("activities", selectedActivityIds);
      await deleteIds("tasks", selectedTaskIds);

      if (opportunitySelected) {
        const remainingAttachmentIds = attachments
          .filter((row) => !selectedAttachmentIds.includes(row.id))
          .map((row) => row.id);

        const remainingNoteIds = notes
          .filter((row) => !selectedNoteIds.includes(row.id))
          .map((row) => row.id);

        const remainingActivityIds = activities
          .filter((row) => !selectedActivityIds.includes(row.id))
          .map((row) => row.id);

        const remainingTaskIds = tasks
          .filter((row) => !selectedTaskIds.includes(row.id))
          .map((row) => row.id);

        await detachIds("attachments", "related_opportunity_id", remainingAttachmentIds);
        await detachIds("notes", "opportunity_id", remainingNoteIds);
        await detachIds("activities", "opportunity_id", remainingActivityIds);
        await detachIds("tasks", "opportunity_id", remainingTaskIds);

        await deleteIds("opportunities", [opportunity.id]);
      }

      setSuccessMessage(
        `Delete complete. Deleted or safely unlinked ${selectedCount} selected item(s).`
      );
      setConfirming(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delete error";
      setErrorMessage(message);
    } finally {
      setDeleting(false);
    }
  }

  function renderCheckbox(
    type: DeleteType,
    id: string,
    title: string,
    details: string
  ) {
    return (
      <label key={recordKey(type, id)} style={checkboxRowStyle}>
        <input
          type="checkbox"
          checked={isChecked(type, id)}
          onChange={() => toggleSelected(type, id)}
          style={{ width: "18px", height: "18px", marginTop: "2px" }}
        />
        <span>
          <strong>{title}</strong>
          <br />
          <span style={{ color: "#94a3b8" }}>{details}</span>
        </span>
      </label>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href="/opportunities" style={secondaryButtonStyle}>
          Back to Opportunities
        </Link>

        {opportunity && (
          <Link href={`/opportunities/${opportunity.id}`} style={secondaryButtonStyle}>
            Back to Opportunity
          </Link>
        )}
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Permanent Delete Review</p>

        <h1 style={titleStyle}>Delete Opportunity Review</h1>

        <p style={mutedTextStyle}>
          Review everything connected directly to this opportunity before
          permanent delete. Only checked records are deleted. Unchecked related
          records are preserved and safely unlinked from the deleted opportunity
          when possible.
        </p>
      </header>

      <section style={warningCardStyle}>
        <h2 style={{ marginTop: 0 }}>Archive Recommended First</h2>

        <p style={{ color: "#fde68a", lineHeight: 1.6 }}>
          Archive should be the normal workflow for old, inactive, duplicate, or
          uncertain records. Permanent delete remains available, but should be
          reserved for records you are sure should be removed from Sell It.
        </p>

        {opportunity && (
          <Link href={`/opportunities/${opportunity.id}`} style={secondaryButtonStyle}>
            Go Back and Archive Instead
          </Link>
        )}
      </section>

      {loading && (
        <section style={cardStyle}>
          <p style={{ margin: 0, color: "#cbd5e1" }}>Loading delete review...</p>
        </section>
      )}

      {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

      {successMessage && (
        <section style={successCardStyle}>
          <h2 style={{ marginTop: 0 }}>Delete Complete</h2>
          <p style={{ color: "#bbf7d0" }}>{successMessage}</p>
          <Link href="/opportunities" style={secondaryButtonStyle}>
            Return to Opportunities
          </Link>
        </section>
      )}

      {!loading && opportunity && !successMessage && (
        <>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Selected Opportunity</h2>

            {renderCheckbox(
              "opportunity",
              opportunity.id,
              opportunity.name,
              `Type: ${opportunity.opportunity_type || "None"} | Stage: ${
                opportunity.stage || "None"
              } | Temperature: ${opportunity.lead_temperature || "None"}`
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Linked Parent Records</h2>

            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
              These are shown for safety/context. They are not deleted from this
              opportunity delete screen.
            </p>

            <p>
              <strong>Company ID:</strong> {opportunity.company_id || "Not linked"}
            </p>

            <p>
              <strong>Primary Contact ID:</strong>{" "}
              {opportunity.primary_contact_id || "Not linked"}
            </p>
          </section>

          <section
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong>Total selected:</strong> {selectedCount}
              <br />
              <span style={{ color: "#94a3b8" }}>
                Default selection is opportunity only. Related records start unchecked.
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={selectAll} style={secondaryButtonStyle}>
                Select All
              </button>

              <button type="button" onClick={unselectAll} style={secondaryButtonStyle}>
                Unselect All
              </button>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Tasks ({tasks.length})</h2>

            {tasks.length === 0 && <p style={emptyTextStyle}>No related tasks.</p>}

            {tasks.map((task) =>
              renderCheckbox(
                "task",
                task.id,
                task.title,
                `Status: ${task.status || "None"} | Priority: ${
                  task.priority || "None"
                } | Due: ${task.due_date || "None"}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Activities ({activities.length})</h2>

            {activities.length === 0 && (
              <p style={emptyTextStyle}>No related activities.</p>
            )}

            {activities.map((activity) =>
              renderCheckbox(
                "activity",
                activity.id,
                activity.subject,
                `Type: ${activity.activity_type || "None"} | Outcome: ${
                  activity.outcome || "None"
                } | Date: ${formatDate(activity.activity_date)}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Notes ({notes.length})</h2>

            {notes.length === 0 && <p style={emptyTextStyle}>No related notes.</p>}

            {notes.map((note) =>
              renderCheckbox(
                "note",
                note.id,
                note.title,
                `Source: ${note.source || "None"} | Tags: ${
                  note.tags || "None"
                } | Created: ${formatDate(note.created_at)}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>
              Direct Opportunity Attachments ({attachments.length})
            </h2>

            {attachments.length === 0 && (
              <p style={emptyTextStyle}>No direct opportunity attachments.</p>
            )}

            {attachments.map((attachment) =>
              renderCheckbox(
                "attachment",
                attachment.id,
                attachment.file_name,
                `Type: ${attachment.file_type || "None"} | Created: ${formatDate(
                  attachment.created_at
                )}`
              )
            )}
          </section>

          <section style={dangerCardStyle}>
            <h2 style={{ marginTop: 0 }}>Final Delete Action</h2>

            <p>
              Selected records: <strong>{selectedCount}</strong>
            </p>

            <p style={{ color: "#fecaca", lineHeight: 1.6 }}>
              Permanent delete cannot be undone from inside Sell It. Use Archive
              first unless you are sure this record should be removed.
            </p>

            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={selectedCount === 0 || deleting}
              style={
                selectedCount === 0 || deleting
                  ? disabledDangerButtonStyle
                  : dangerButtonStyle
              }
            >
              Review Final Confirmation
            </button>
          </section>

          {confirming && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.78)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                zIndex: 50,
              }}
            >
              <section
                style={{
                  ...dangerCardStyle,
                  maxWidth: "560px",
                  marginBottom: 0,
                }}
              >
                <h2 style={{ marginTop: 0 }}>Confirm Delete</h2>

                <p>
                  You are about to delete or unlink{" "}
                  <strong>{selectedCount}</strong> selected item(s) for opportunity{" "}
                  <strong>{opportunity.name}</strong>.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    style={deleting ? disabledDangerButtonStyle : dangerButtonStyle}
                  >
                    {deleting ? "Deleting..." : "Yes, Delete Selected Records"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </main>
  );
}