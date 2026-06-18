"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";

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

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "18px",
  backgroundColor: "#151515",
  maxWidth: "900px",
  marginBottom: "18px",
};

const buttonStyle: CSSProperties = {
  backgroundColor: "#f5d76e",
  color: "black",
  border: "none",
  borderRadius: "8px",
  padding: "12px 16px",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
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

    const { error: statusError } = await supabase
      .from("tasks")
      .update({
        status: "Completed",
        completed_at: changedAt,
        completed_by: USER_ID,
        updated_by: USER_ID,
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
        completed_by: USER_ID,
      })
      .eq("id", taskId);

    setTask({
      ...task,
      status: "Completed",
      completed_at: changedAt,
      completed_by: USER_ID,
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
      setSuccessMessage("Task marked Completed. Completed At and Completed By were saved.");
    }

    router.refresh();
  }

  if (loading) {
    return (
      <main style={{ padding: "24px", color: "white" }}>
        <p>Loading task...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px", color: "white" }}>
      <Link href="/assistant" style={{ color: "#8ab4ff" }}>
        â† Back to Assistant
      </Link>

      <h1>Assistant Action: Mark Task Complete</h1>

      <div
        style={{
          border: "1px solid #f5d76e",
          backgroundColor: "#211c0d",
          color: "#ffcc66",
          padding: "14px",
          borderRadius: "8px",
          marginBottom: "18px",
          maxWidth: "900px",
        }}
      >
        This action will update the database only after you confirm and press the button below.
      </div>

      {errorMessage && (
        <div
          style={{
            border: "1px solid #ff6b6b",
            backgroundColor: "#2a1111",
            color: "#ff9999",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
            maxWidth: "900px",
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            border: "1px solid #46d369",
            backgroundColor: "#102414",
            color: "#8ff0a4",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
            maxWidth: "900px",
          }}
        >
          {successMessage}
        </div>
      )}

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
              <p style={{ whiteSpace: "pre-wrap" }}>
                <strong>Description:</strong>
                <br />
                {task.description}
              </p>
            )}

            <p style={{ color: "#aaa", marginBottom: 0 }}>
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
              <span>I confirm I want to mark this task Completed.</span>
            </label>

            <button
              type="submit"
              disabled={!confirmed || saving || task.status === "Completed"}
              style={
                !confirmed || saving || task.status === "Completed"
                  ? disabledButtonStyle
                  : buttonStyle
              }
            >
              {saving ? "Completing..." : "Mark Complete"}
            </button>
          </form>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href={`/tasks/${taskId}`} style={{ color: "#8ab4ff" }}>
              Open Task
            </Link>
            <Link href="/assistant" style={{ color: "#8ab4ff" }}>
              Back to Assistant
            </Link>
          </div>
        </>
      )}
    </main>
  );
}