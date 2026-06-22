"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";
import { getCurrentActingUserSnapshot, getDatabaseSafeUserId } from "../../../../../lib/actingUser";
import { createWorkLogEntry } from "../../../../../lib/workLog";

const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  updated_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
};

type SupabaseLikeError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  maxWidth: "900px",
  marginBottom: "18px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
};

const buttonStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  color: "white",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  borderRadius: "999px",
  padding: "12px 16px",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.28)",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  textDecoration: "none",
  fontWeight: 800,
};

const secondaryLinkButtonStyle: CSSProperties = {
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
  background: "rgba(15, 23, 42, 0.74)",
};

const headerStyle: CSSProperties = {
  maxWidth: "900px",
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 32%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#a78bfa",
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
  maxWidth: "820px",
  lineHeight: 1.65,
};

const noticeStyle: CSSProperties = {
  border: "1px solid rgba(167, 139, 250, 0.32)",
  background: "rgba(88, 28, 135, 0.22)",
  color: "#ddd6fe",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "900px",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "900px",
};

const successStyle: CSSProperties = {
  border: "1px solid rgba(34, 197, 94, 0.32)",
  background: "rgba(20, 83, 45, 0.22)",
  color: "#bbf7d0",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "900px",
};

function isMissingOptionalCompletionColumn(error: SupabaseLikeError | null) {
  if (!error) return false;

  const errorText = [
    error.code || "",
    error.message || "",
    error.details || "",
    error.hint || "",
  ]
    .join(" ")
    .toLowerCase();

  return (
    error.code === "PGRST204" ||
    errorText.includes("completed_at") ||
    errorText.includes("completed_by") ||
    errorText.includes("schema cache")
  );
}

export default function AssistantCompleteTaskPage() {
  const params = useParams();
  const router = useRouter();

  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadTask() {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id, title, description, due_date, priority, status, company_id, contact_id, opportunity_id, updated_at, completed_at, completed_by"
        )
        .eq("id", taskId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setTask(data as Task);
    }

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  async function handleConfirmComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!task) return;

    if (!confirmed) {
      setErrorMessage("Confirm the action before updating the task.");
      return;
    }

    if (task.status === "Completed") {
      setSuccessMessage(
        "This task is already completed. No database update was performed."
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const changedAt = new Date().toISOString();
    const actingUser = getCurrentActingUserSnapshot();
    const databaseSafeUserId = getDatabaseSafeUserId(actingUser);

    const { error: statusError } = await supabase
      .from("tasks")
      .update({
        status: "Completed",
        completed_at: changedAt,
        completed_by: databaseSafeUserId,
        updated_by: databaseSafeUserId,
        updated_at: changedAt,
      })
      .eq("id", taskId);

    if (statusError) {
      setSaving(false);
      setErrorMessage(statusError.message);
      return;
    }

    const { error: completionMetadataError } = await supabase
      .from("tasks")
      .update({
        completed_at: changedAt,
        completed_by: databaseSafeUserId,
      })
      .eq("id", taskId);

    await createWorkLogEntry({
      actingUser,
      actionType: "task_completion",
      entityType: "task",
      entityId: taskId,
      entityLabel: task.title,
      summary: `${actingUser.displayName} completed task "${task.title}".`,
      details: "Task status changed to Completed from the Assistant complete action.",
      metadata: {
        source: "Task Complete Assistant Work Log V1",
        previous_status: task.status,
        new_status: "Completed",
        completed_at: changedAt,
        completed_by: databaseSafeUserId,
      },
    });

    setTask({
      ...task,
      status: "Completed",
      completed_at: changedAt,
      completed_by: databaseSafeUserId,
      updated_at: changedAt,
    });

    if (
      completionMetadataError &&
      !isMissingOptionalCompletionColumn(completionMetadataError)
    ) {
      setSaving(false);
      setErrorMessage(
        `Task status was updated to Completed, but completion metadata failed: ${completionMetadataError.message}`
      );
      router.refresh();
      return;
    }

    setSaving(false);

    if (
      completionMetadataError &&
      isMissingOptionalCompletionColumn(completionMetadataError)
    ) {
      setSuccessMessage(
        "Task marked Completed. This database does not appear to have completed_at/completed_by fields yet, so only status and updated fields were saved."
      );
    } else {
      setSuccessMessage(
        "Task marked Completed. Completed At and Completed By were saved."
      );
    }

    router.refresh();
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <p>Loading task...</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <Link href="/assistant" style={linkStyle}>
          Back to Assistant
        </Link>

        {task && (
          <Link href={`/tasks/${task.id}`} style={linkStyle}>
            Open Task
          </Link>
        )}
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Assistant Action</p>

        <h1 style={titleStyle}>Complete Task</h1>

        <p style={mutedTextStyle}>
          Review this task before marking it complete. Sell It will not update
          the task until you confirm and press Mark Task Complete.
        </p>
      </header>

      <div style={noticeStyle}>
        This action will update the database only after you confirm and press
        the button below.
      </div>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {!task ? (
        <div style={cardStyle}>Task not found.</div>
      ) : (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>{task.title}</h2>

            <p>
              <strong>Current Status:</strong> {task.status}
            </p>

            {task.status === "Completed" && (
              <>
                <p>
                  <strong>Completed At:</strong>{" "}
                  {task.completed_at
                    ? new Date(task.completed_at).toLocaleString()
                    : "Not saved yet"}
                </p>

                <p>
                  <strong>Completed By:</strong>{" "}
                  {task.completed_by || "Not saved yet"}
                </p>
              </>
            )}

            <p>
              <strong>Priority:</strong> {task.priority}
            </p>

            <p>
              <strong>Due Date:</strong>{" "}
              {task.due_date ? task.due_date.slice(0, 10) : "No due date"}
            </p>

            {task.description && (
              <p style={{ whiteSpace: "pre-wrap", color: "#cbd5e1" }}>
                <strong>Description:</strong>
                <br />
                {task.description}
              </p>
            )}

            <p style={{ color: "#94a3b8", marginBottom: 0 }}>
              This will change the task status to Completed.
            </p>
          </div>

          <form onSubmit={handleConfirmComplete} style={cardStyle}>
            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                marginBottom: "16px",
              }}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={saving || task.status === "Completed"}
              />
              <span>
                I confirm I want to mark this task{" "}
                <strong>Completed</strong>.
              </span>
            </label>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={!confirmed || saving || task.status === "Completed"}
                style={
                  !confirmed || saving || task.status === "Completed"
                    ? disabledButtonStyle
                    : buttonStyle
                }
              >
                {task.status === "Completed"
                  ? "Already Completed"
                  : saving
                    ? "Completing..."
                    : "Mark Complete"}
              </button>

              <Link href="/assistant" style={secondaryLinkButtonStyle}>
                Cancel
              </Link>
            </div>
          </form>
        </>
      )}
    </main>
  );
}





