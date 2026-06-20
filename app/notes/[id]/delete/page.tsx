"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type Note = {
  id: string;
  workspace_id: string;
  title: string;
  body: string | null;
  source: string | null;
  source_url: string | null;
  tags: string | null;
  created_at: string | null;
};

type Attachment = {
  id: string;
  file_name: string;
  file_type: string | null;
  related_note_id: string | null;
  created_at: string | null;
};

type DeleteType = "note" | "attachment";
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

export default function DeleteNotePage() {
  const params = useParams<{ id: string }>();
  const noteId = params.id;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [note, setNote] = useState<Note | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});

  const allKeys = useMemo(() => {
    const keys: string[] = [];

    if (note) keys.push(recordKey("note", note.id));
    attachments.forEach((row) => keys.push(recordKey("attachment", row.id)));

    return keys;
  }, [note, attachments]);

  const selectedCount = countSelected(selected);

  useEffect(() => {
    async function loadDeleteReview() {
      setLoading(true);
      setErrorMessage("");

      const { data: noteRow, error: noteError } = await supabase
        .from("notes")
        .select("id, workspace_id, title, body, source, source_url, tags, created_at")
        .eq("id", noteId)
        .single();

      if (noteError) {
        setErrorMessage(noteError.message);
        setLoading(false);
        return;
      }

      const attachmentResult = await supabase
        .from("attachments")
        .select("id, file_name, file_type, related_note_id, created_at")
        .eq("related_note_id", noteId)
        .order("created_at", { ascending: false });

      if (attachmentResult.error) {
        setErrorMessage(attachmentResult.error.message);
        setLoading(false);
        return;
      }

      const loadedNote = noteRow as Note;

      setNote(loadedNote);
      setAttachments((attachmentResult.data ?? []) as Attachment[]);
      setSelected({
        [recordKey("note", loadedNote.id)]: true,
      });

      setLoading(false);
    }

    loadDeleteReview();
  }, [noteId]);

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
    if (!note || selectedCount === 0) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const noteSelected = isChecked("note", note.id);
      const selectedAttachmentIds = idsFor("attachment", attachments);

      await deleteIds("attachments", selectedAttachmentIds);

      if (noteSelected) {
        const remainingAttachmentIds = attachments
          .filter((row) => !selectedAttachmentIds.includes(row.id))
          .map((row) => row.id);

        await detachIds("attachments", "related_note_id", remainingAttachmentIds);
        await deleteIds("notes", [note.id]);
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
        <Link href="/notes" style={secondaryButtonStyle}>
          Back to Notes
        </Link>

        {note && (
          <Link href={`/notes/${note.id}`} style={secondaryButtonStyle}>
            Back to Note
          </Link>
        )}
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Permanent Delete Review</p>

        <h1 style={titleStyle}>Delete Note Review</h1>

        <p style={mutedTextStyle}>
          Review everything connected directly to this note before deleting. Only
          checked records are deleted. Unchecked related attachments are preserved
          and safely unlinked from the deleted note when possible.
        </p>
      </header>

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
          <Link href="/notes" style={secondaryButtonStyle}>
            Return to Notes
          </Link>
        </section>
      )}

      {!loading && note && !successMessage && (
        <>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Selected Note</h2>

            {renderCheckbox(
              "note",
              note.id,
              note.title,
              `Source: ${note.source || "None"} | Tags: ${
                note.tags || "None"
              } | Created: ${formatDate(note.created_at)}`
            )}

            <p style={{ color: "#cbd5e1", whiteSpace: "pre-wrap", marginTop: "16px" }}>
              {note.body || "No note body."}
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
                Default selection is note only. Related records start unchecked.
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
            <h2 style={{ marginTop: 0 }}>Attachments ({attachments.length})</h2>

            {attachments.length === 0 && (
              <p style={emptyTextStyle}>No related attachments.</p>
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
                  <strong>{selectedCount}</strong> selected item(s) for note{" "}
                  <strong>{note.title}</strong>.
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