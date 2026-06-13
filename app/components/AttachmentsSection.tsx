"use client";

import { useEffect, useState } from "react";
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
  | "related_note_id";

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

      // This supports the older column that already existed in your database.
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
    <section style={{ marginTop: "40px", maxWidth: "750px" }}>
      <h2>Attachments</h2>

      <div
        style={{
          border: "1px solid #333",
          padding: "20px",
          borderRadius: "8px",
          backgroundColor: "#1a1a1a",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Upload File</h3>

        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px" }}>
              File
            </label>

            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "white",
                color: "black",
                borderRadius: "6px",
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px" }}>
              File Type
            </label>

            <select
              value={fileType}
              onChange={(event) => setFileType(event.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
              }}
            >
              {fileTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px" }}>
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this file?"
              rows={3}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            style={{
              color: "black",
              backgroundColor: "white",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isUploading ? "Uploading..." : "Upload Attachment"}
          </button>
        </form>

        {message && <p style={{ marginTop: "12px" }}>{message}</p>}
      </div>

      {attachments.length === 0 && <p>No attachments uploaded yet.</p>}

      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          style={{
            border: "1px solid #333",
            padding: "16px",
            marginBottom: "12px",
            borderRadius: "8px",
            backgroundColor: "#1a1a1a",
          }}
        >
          <h3 style={{ marginTop: 0 }}>{attachment.file_name}</h3>

          <p>Type: {attachment.file_type}</p>

          {attachment.description && (
            <p>Description: {attachment.description}</p>
          )}

          <p>
            Uploaded:{" "}
            {attachment.created_at
              ? new Date(attachment.created_at).toLocaleString()
              : "Not available"}
          </p>

          <button
            type="button"
            onClick={() => openAttachment(attachment)}
            style={{
              color: "black",
              backgroundColor: "white",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Open / Download
          </button>
        </div>
      ))}
    </section>
  );
}