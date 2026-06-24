"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { getDatabaseSafeUserId } from "../../../../lib/actingUser";
import { createWorkLogEntry } from "../../../../lib/workLog";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";

const categories = [
  "Recruiting",
  "Contractors",
  "Brokers",
  "Drivers",
  "Knotty Logistics",
  "General Marketing",
];

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "850px",
  margin: "0 auto",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "22px",
  padding: "18px",
  background:
    "linear-gradient(180deg, rgba(30, 41, 59, 0.86), rgba(15, 23, 42, 0.92))",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  color: "#dbeafe",
  fontWeight: 850,
  fontSize: "13px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: "13px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  backgroundColor: "rgba(15, 23, 42, 0.94)",
  color: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
};

const buttonStyle: CSSProperties = {
  border: "1px solid rgba(167, 139, 250, 0.55)",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
  color: "white",
  fontWeight: 950,
  padding: "12px 16px",
  cursor: "pointer",
  textDecoration: "none",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.8)",
  color: "#f8fafc",
  fontWeight: 900,
  padding: "10px 13px",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
};

const mutedStyle: CSSProperties = {
  color: "#94a3b8",
  lineHeight: 1.5,
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.35)",
  background: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "11px 12px",
  borderRadius: "14px",
};

export default function EditSocialMediaAssetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const assetId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General Marketing");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadAsset() {
      const result = await supabase
        .from("social_media_assets")
        .select("*")
        .eq("id", assetId)
        .single();

      setLoading(false);

      if (result.error || !result.data) {
        setErrorMessage(result.error?.message || "Media item not found.");
        return;
      }

      const asset = result.data as Record<string, string | null>;

      setTitle(asset.title || "");
      setCategory(asset.category || "General Marketing");
      setTags(asset.tags || "");
      setDescription(asset.description || "");
      setFileName(asset.file_name || "");
    }

    loadAsset();
  }, [assetId]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    let filePayload: Record<string, string | null> = {};

    if (file) {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const storagePath = `${WORKSPACE_ID}/social-media-assets/${Date.now()}-${safeFileName}`;

      const uploadResult = await supabase.storage
        .from("sell-it-attachments")
        .upload(storagePath, file);

      if (uploadResult.error) {
        setSaving(false);
        setErrorMessage(uploadResult.error.message);
        return;
      }

      const signedUrlResult = await supabase.storage
        .from("sell-it-attachments")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

      filePayload = {
        file_name: file.name,
        file_type: file.type || "File",
        storage_path: storagePath,
        file_url: signedUrlResult.data?.signedUrl ?? null,
      };
    }

    const result = await supabase
      .from("social_media_assets")
      .update({
        title,
        category: category || null,
        tags: tags || null,
        description: description || null,
        ...filePayload,
        updated_by: getDatabaseSafeUserId(),
      })
      .eq("id", assetId);

    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    await createWorkLogEntry({
      actionType: "updated",
      entityType: "social_media_asset",
      entityId: assetId,
      entityLabel: title,
      summary: `Updated media asset ${title}.`,
    });

    router.push(`/social-intelligence/media/${assetId}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div>
            <p style={{ margin: "0 0 8px", color: "#c4b5fd", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Social Intelligence / Edit Media
            </p>
            <h1 style={{ margin: 0 }}>Edit Media Item</h1>
            <p style={mutedStyle}>Update the stored marketing media record.</p>
          </div>

          <Link href={`/social-intelligence/media/${assetId}`} style={secondaryButtonStyle}>
            Back to Detail
          </Link>
        </div>

        {errorMessage && <p style={errorStyle}>Error: {errorMessage}</p>}

        {loading ? (
          <section style={cardStyle}>
            <h2>Loading...</h2>
          </section>
        ) : (
          <form onSubmit={handleSubmit} style={{ ...cardStyle, display: "grid", gap: "13px" }}>
            <label style={labelStyle}>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} required style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value)} style={inputStyle}>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Tags
              <input value={tags} onChange={(event) => setTags(event.target.value)} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
            </label>

            <label style={labelStyle}>
              Replace File
              <input type="file" onChange={handleFileChange} style={inputStyle} />
            </label>

            <p style={mutedStyle}>Current file: {fileName || "No file attached"}</p>

            <button type="submit" disabled={saving} style={buttonStyle}>
              {saving ? "Saving..." : "Save Media Item"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
