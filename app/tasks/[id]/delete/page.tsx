"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type Activity = {
  id: string;
  subject: string;
  activity_type: string | null;
  activity_date: string | null;
  task_id: string | null;
};

type Attachment = {
  id: string;
  file_name: string;
  file_type: string | null;
  related_task_id: string | null;
  created_at: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
};

type DeleteType = "task" | "activity" | "attachment";
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

const headerStyle: CSSProperties = {
  maxWidth: "980px",
  marginBottom: "24px",
  border: "1px solid rgba(248, 113, 113, 0.24)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(127, 29, 29, 0.32), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
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
  maxWidth: "860px",
  lineHeight: 1.65,
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  padding: "20px",
  borderRadius: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  marginBottom: "18px",
  maxWidth: "980px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
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
  background: "rgba(127, 29, 29, 0.34)",
  border: "1px solid rgba(248, 113, 113, 0.42)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
};

const disabledDangerButtonStyle: CSSProperties = {
  ...dangerButtonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const checkboxRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: "10px",
  alignItems: "flex-start",
  padding: "14px",
  borderTop: "1px solid rgba(148, 163, 184, 0.16)",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "980px",
};

const successStyle: CSSProperties = {
  border: "1px solid rgba(34, 197, 94, 0.32)",
  background: "rgba(20, 83, 45, 0.22)",
  color: "#bbf7d0",
  padding: "20px",
  borderRadius: "20px",
  marginBottom: "18px",
  maxWidth: "980px",
};

const warningCardStyle: CSSProperties = {
  ...cardStyle,
  border: "1px solid rgba(248, 113, 113, 0.34)",
  background:
    "linear-gradient(180deg, rgba(127, 29, 29, 0.32), rgba(15, 23, 42, 0.76))",
};

const modalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(2, 6, 23, 0.82)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  zIndex: 50,
};

const modalCardStyle: CSSProperties = {
  ...cardStyle,
  maxWidth: "580px",
  border: "1px solid rgba(248, 113, 113, 0.42)",
  background:
    "radial-gradient(circle at top left, rgba(127, 29, 29, 0.32), transparent 36%), linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.9))",
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

export default function DeleteTaskPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});

  const allKeys = useMemo(() => {
    const keys: string[] = [];

    if (task) keys.push(recordKey("task", task.id));
    activities.forEach((row) => keys.push(recordKey("activity", row.id)));
    attachments.forEach((row) => keys.push(recordKey("attachment", row.id)));

    return keys;
  }, [task, activities, attachments]);

  const selectedCount = countSelected(selected);

  useEffect(() => {
    async function loadDeleteReview() {
      setLoading(true);
      setErrorMessage("");

      const { data: taskRow, error: taskError } = await supabase
        .from("tasks")
        .select(
          "id, title, description, due_date, priority, status, company_id, contact_id, opportunity_id"
        )
        .eq("id", taskId)
        .single();

      if (taskError) {
        setErrorMessage(taskError.message);
        setLoading(false);
        return;
      }

      const [activityResult, attachmentResult] = await Promise.all([
        supabase
          .from("activities")
          .select("id, subject, activity_type, activity_date, task_id")
          .eq("task_id", taskId)
          .order("activity_date", { ascending: false }),

        supabase
          .from("attachments")
          .select("id, file_name, file_type, related_task_id, created_at")
          .eq("related_task_id", taskId)
          .order("created_at", { ascending: false }),
      ]);

      const firstError = activityResult.error || attachmentResult.error;

      if (firstError) {
        setErrorMessage(firstError.message);
        setLoading(false);
        return;
      }

      const loadedTask = taskRow as Task;

      setTask(loadedTask);
      setActivities((activityResult.data ?? []) as Activity[]);
      setAttachments((attachmentResult.data ?? []) as Attachment[]);
      setSelected({
        [recordKey("task", loadedTask.id)]: true,
      });

      setLoading(false);
    }

    loadDeleteReview();
  }, [taskId]);

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

  async function handleDeleteSelected() {
    if (!task || selectedCount === 0) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const taskSelected = isChecked("task", task.id);
      const selectedActivityIds = idsFor("activity", activities);
      const selectedAttachmentIds = idsFor("attachment", attachments);

      await deleteIds("attachments", selectedAttachmentIds);
      await deleteIds("activities", selectedActivityIds);

      if (taskSelected) {
        const remainingActivityIds = activities
          .filter((row) => !selectedActivityIds.includes(row.id))
          .map((row) => row.id);

        const remainingAttachmentIds = attachments
          .filter((row) => !selectedAttachmentIds.includes(row.id))
          .map((row) => row.id);

        await detachIds("activities", "task_id", remainingActivityIds);
        await detachIds(
          "attachments",
          "related_task_id",
          remainingAttachmentIds
        );

        await deleteIds("tasks", [task.id]);
      }

      setSuccessMessage(
        `Delete complete. Deleted or safely unlinked ${selectedCount} selected item(s).`
      );
      setConfirming(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown delete error";
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
        <Link href="/tasks" style={secondaryButtonStyle}>
          Back to Tasks
        </Link>

        {task && (
          <Link href={`/tasks/${task.id}`} style={secondaryButtonStyle}>
            Back to Task
          </Link>
        )}
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Delete Review</p>

        <h1 style={titleStyle}>Delete Task</h1>

        <p style={mutedTextStyle}>
          Review everything connected directly to this task before deleting.
          Only checked records are deleted. Unchecked related records are
          preserved and safely unlinked when possible.
        </p>
      </header>

      {loading && (
        <div style={cardStyle}>
          <p style={{ margin: 0, color: "#cbd5e1" }}>
            Loading delete review...
          </p>
        </div>
      )}

      {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

      {successMessage && (
        <div style={successStyle}>
          <h2 style={{ marginTop: 0 }}>Delete Complete</h2>
          <p>{successMessage}</p>
          <Link href="/tasks" style={secondaryButtonStyle}>
            Return to Tasks
          </Link>
        </div>
      )}

      {!loading && task && !successMessage && (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Selected Task</h2>

            {renderCheckbox(
              "task",
              task.id,
              task.title,
              `Status: ${task.status || "None"} | Priority: ${
                task.priority || "None"
              } | Due: ${task.due_date || "None"}`
            )}
          </div>

          <div
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
                Default selection is task only. Related records start unchecked.
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={selectAll} style={secondaryButtonStyle}>
                Select All
              </button>

              <button
                type="button"
                onClick={unselectAll}
                style={secondaryButtonStyle}
              >
                Unselect All
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Activities ({activities.length})</h2>

            {activities.length === 0 && (
              <p style={{ color: "#94a3b8" }}>No related activities.</p>
            )}

            {activities.map((activity) =>
              renderCheckbox(
                "activity",
                activity.id,
                activity.subject,
                `Type: ${activity.activity_type || "None"} | Date: ${formatDate(
                  activity.activity_date
                )}`
              )
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Attachments ({attachments.length})</h2>

            {attachments.length === 0 && (
              <p style={{ color: "#94a3b8" }}>No related attachments.</p>
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
          </div>

          <div style={warningCardStyle}>
            <h2 style={{ marginTop: 0 }}>Final Delete Action</h2>

            <p>
              Selected records: <strong>{selectedCount}</strong>
            </p>

            <p style={{ color: "#fecaca" }}>
              This action cannot be undone from inside Sell It yet.
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
          </div>

          {confirming && (
            <div style={modalBackdropStyle}>
              <div style={modalCardStyle}>
                <h2 style={{ marginTop: 0 }}>Confirm Delete</h2>

                <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                  You are about to delete or unlink{" "}
                  <strong>{selectedCount}</strong> selected item(s) for task{" "}
                  <strong>{task.title}</strong>.
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
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}