import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type PageProps = {
  params: Promise<{ id: string }>;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "22px",
  padding: "18px",
  background:
    "linear-gradient(180deg, rgba(30, 41, 59, 0.86), rgba(15, 23, 42, 0.92))",
};

const mutedStyle: CSSProperties = {
  color: "#94a3b8",
  lineHeight: 1.5,
};

const buttonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.8)",
  color: "#f8fafc",
  fontWeight: 900,
  padding: "10px 13px",
  textDecoration: "none",
  display: "inline-flex",
};

export default async function SocialMediaAssetDetailPage({ params }: PageProps) {
  const { id } = await params;

  const result = await supabase
    .from("social_media_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (result.error || !result.data) {
    return (
      <main style={pageStyle}>
        <section style={shellStyle}>
          <h1>Media Item Not Found</h1>
          <p style={mutedStyle}>{result.error?.message || "No record found."}</p>
          <Link href="/social-intelligence" style={buttonStyle}>Back</Link>
        </section>
      </main>
    );
  }

  const asset = result.data as Record<string, string | null>;

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div>
            <p style={{ margin: "0 0 8px", color: "#c4b5fd", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Social Intelligence / Media
            </p>
            <h1 style={{ margin: 0 }}>{asset.title || "Untitled Media"}</h1>
            <p style={mutedStyle}>{asset.category || "No category"} | {asset.file_name || "No file attached"}</p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/social-intelligence" style={buttonStyle}>Back</Link>
            <Link href={`/social-intelligence/media/${id}/edit`} style={buttonStyle}>Edit</Link>
          </div>
        </div>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Media Details</h2>
          <p style={mutedStyle}>Category: {asset.category || "None saved"}</p>
          <p style={mutedStyle}>Tags: {asset.tags || "None saved"}</p>
          <p style={mutedStyle}>Description: {asset.description || "None saved"}</p>
          <p style={mutedStyle}>Uploaded By: {asset.uploaded_by_name || "None saved"}</p>
          <p style={mutedStyle}>Created: {asset.created_at || "None saved"}</p>
          <p style={mutedStyle}>Storage Path: {asset.storage_path || "None saved"}</p>
        </section>
      </section>
    </main>
  );
}
