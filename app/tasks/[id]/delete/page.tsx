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
  backgroundColor: "#111",
  color: "white",
  padding: "40px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  padding: "18px",
  borderRadius: "10px",
  backgroundColor: "#1a1a1a",
  marginBottom: "16px",
  maxWidth: "950px",
};

const buttonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "10px 14px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#ffdddd",
};

const checkboxRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: "10px",
  alignItems: "flex-start",
  padding: "12px",
  borderTop: "1px solid #333",
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
        .select("id, title, description, due_date, priority, status, company_id, contact_id, opportunity_id")
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
        await detachIds("attachments", "related_task_id", remainingAttachmentIds);

        await deleteIds("tasks", [task.id]);
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
          <span style={{ color: "#aaa" }}>{details}</span>
        </span>
      </label>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        <Link href="/tasks" style={buttonStyle}>
          Back to Tasks
        </Link>

        {task && (
          <Link href={`/tasks/${task.id}`} style={buttonStyle}>
            Back to Task
          </Link>
        )}
      </div>

      <h1>Delete Task Review</h1>

      <p style={{ color: "#aaa", maxWidth: "850px", lineHeight: 1.5 }}>
        Review everything connected directly to this task before deleting. Only checked
        records are deleted. Unchecked related records are preserved. If the task itself
        is deleted, unchecked related records are safely unlinked from the deleted task
        when possible.
      </p>

      {loading && <p>Loading delete review...</p>}

      {errorMessage && (
        <p style={{ color: "red", fontWeight: "bold" }}>Error: {errorMessage}</p>
      )}

      {successMessage && (
        <div style={{ ...cardStyle, borderColor: "#2f8f2f" }}>
          <h2 style={{ marginTop: 0 }}>Delete Complete</h2>
          <p style={{ color: "#90ee90" }}>{successMessage}</p>
          <Link href="/tasks" style={buttonStyle}>
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
              `Status: ${task.status || "None"} | Priority: ${task.priority || "None"} | Due: ${
                task.due_date || "None"
              }`
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
              <span style={{ color: "#aaa" }}>
                Default selection is task only. Related records start unchecked.
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={selectAll} style={buttonStyle}>
                Select All
              </button>

              <button type="button" onClick={unselectAll} style={buttonStyle}>
                Unselect All
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Activities ({activities.length})</h2>

            {activities.length === 0 && (
              <p style={{ color: "#aaa" }}>No related activities.</p>
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
              <p style={{ color: "#aaa" }}>No related attachments.</p>
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

          <div
            style={{
              ...cardStyle,
              borderColor: "#8f2f2f",
              backgroundColor: "#201111",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Final Delete Action</h2>

            <p>
              Selected records: <strong>{selectedCount}</strong>
            </p>

            <p style={{ color: "#ffb3b3" }}>
              This action cannot be undone from inside Sell It yet.
            </p>

            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={selectedCount === 0 || deleting}
              style={dangerButtonStyle}
            >
              Review Final Confirmation
            </button>
          </div>

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
              }}
            >
              <div
                style={{
                  ...cardStyle,
                  maxWidth: "560px",
                  borderColor: "#ff9999",
                  backgroundColor: "#1a1a1a",
                }}
              >
                <h2 style={{ marginTop: 0 }}>Confirm Delete</h2>

                <p>
                  You are about to delete or unlink <strong>{selectedCount}</strong>{" "}
                  selected item(s) for task <strong>{task.title}</strong>.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    style={dangerButtonStyle}
                  >
                    {deleting ? "Deleting..." : "Yes, Delete Selected Records"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    style={buttonStyle}
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
