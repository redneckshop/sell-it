"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

type Attachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string | null;
  storage_path: string;
  description: string | null;
  created_at: string | null;
  uploaded_by: string | null;
};

type AttachmentRelation =
  | "related_company_id"
  | "related_contact_id"
  | "related_opportunity_id"
  | "related_task_id"
  | "related_activity_id"
  | "related_note_id"
  | "related_post_id";

type AttachmentsSectionProps = {
  workspaceId: string;
  relationColumn: AttachmentRelation;
  relationId: string;
};

const fileTypes = [
  "Screenshot",
  "Image",
  "PDF",
  "Document",
  "Transcript",
  "Audio",
  "Other",
];

const sectionStyle: CSSProperties = {
  marginTop: "10px",
  maxWidth: "860px",
};

const uploadCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "18px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(15, 23, 42, 0.66))",
  marginBottom: "18px",
};

const attachmentCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "12px",
  background: "rgba(15, 23, 42, 0.72)",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#cbd5e1",
  fontWeight: 800,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "12px",
  boxSizing: "border-box",
  outline: "none",
};

const buttonStyle: CSSProperties = {
  color: "white",
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  padding: "12px 16px",
  borderRadius: "999px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.22)",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const secondaryButtonStyle: CSSProperties = {
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  padding: "10px 14px",
  borderRadius: "999px",
  fontWeight: 800,
  cursor: "pointer",
};

const messageStyle: CSSProperties = {
  border: "1px solid rgba(167, 139, 250, 0.32)",
  background: "rgba(88, 28, 135, 0.18)",
  color: "#ddd6fe",
  padding: "12px",
  borderRadius: "14px",
  marginTop: "12px",
};

const emptyStyle: CSSProperties = {
  color: "#94a3b8",
  marginBottom: 0,
};

const metaStyle: CSSProperties = {
  color: "#94a3b8",
  margin: "6px 0",
};

export default function AttachmentsSection({
  workspaceId,
  relationColumn,
  relationId,
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("Other");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function loadAttachments() {
    const { data, error } = await supabase
      .from("attachments")
      .select(
        "id, file_name, file_type, file_url, storage_path, description, created_at, uploaded_by"
      )
      .eq(relationColumn, relationId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Could not load attachments: ${error.message}`);
      return;
    }

    setAttachments(data ?? []);
  }

  useEffect(() => {
    loadAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationColumn, relationId]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!file) {
      setMessage("Choose a file first.");
      return;
    }

    setIsUploading(true);

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    const storagePath = `${workspaceId}/${relationColumn}/${relationId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("sell-it-attachments")
      .upload(storagePath, file);

    if (uploadError) {
      setIsUploading(false);
      setMessage(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("sell-it-attachments")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signedUrlError) {
      setIsUploading(false);
      setMessage(`File uploaded, but link failed: ${signedUrlError.message}`);
      return;
    }

    const insertPayload = {
      workspace_id: workspaceId,
      [relationColumn]: relationId,
      file_name: file.name,
      file_type: fileType,
      file_url: signedUrlData.signedUrl,
      storage_path: storagePath,
      file_path: storagePath,
      description: description || null,
      uploaded_by: null,
    };

    const { error: insertError } = await supabase
      .from("attachments")
      .insert(insertPayload);

    if (insertError) {
      setIsUploading(false);
      setMessage(
        `File uploaded, but database save failed: ${insertError.message}`
      );
      return;
    }

    setFile(null);
    setFileType("Other");
    setDescription("");
    setIsUploading(false);
    setMessage("Attachment uploaded.");
    await loadAttachments();
  }

  async function openAttachment(attachment: Attachment) {
    setMessage("");

    const { data, error } = await supabase.storage
      .from("sell-it-attachments")
      .createSignedUrl(attachment.storage_path, 60 * 60);

    if (error) {
      setMessage(`Could not open file: ${error.message}`);
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  return (
    <section style={sectionStyle}>
      <div style={uploadCardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Upload File</h3>

        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>File</label>

            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>File Type</label>

            <select
              value={fileType}
              onChange={(event) => setFileType(event.target.value)}
              style={inputStyle}
            >
              {fileTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Description</label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this file?"
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "96px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            style={isUploading ? disabledButtonStyle : buttonStyle}
          >
            {isUploading ? "Uploading..." : "Upload Attachment"}
          </button>
        </form>

        {message && <div style={messageStyle}>{message}</div>}
      </div>

      {attachments.length === 0 && (
        <p style={emptyStyle}>No attachments uploaded yet.</p>
      )}

      {attachments.map((attachment) => (
        <div key={attachment.id} style={attachmentCardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
            {attachment.file_name}
          </h3>

          <p style={metaStyle}>
            <strong>Type:</strong> {attachment.file_type}
          </p>

          {attachment.description && (
            <p style={metaStyle}>
              <strong>Description:</strong> {attachment.description}
            </p>
          )}

          <p style={metaStyle}>
            <strong>Uploaded:</strong>{" "}
            {attachment.created_at
              ? new Date(attachment.created_at).toLocaleString()
              : "Not available"}
          </p>

          <button
            type="button"
            onClick={() => openAttachment(attachment)}
            style={secondaryButtonStyle}
          >
            Open / Download
          </button>
        </div>
      ))}
    </section>
  );
}