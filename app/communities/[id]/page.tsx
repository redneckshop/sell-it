import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Community = {
  id: string;
  workspace_id: string | null;
  name: string;
  platform: string;
  url: string | null;
  description: string | null;
  member_count: number | null;
  industry: string | null;
  location_focus: string | null;
  status: string;
  joined_date: string | null;
  rules_notes: string | null;
  relevance_score: number | null;
  tags: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CommunityDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: community, error } = await supabase
    .from("communities")
    .select(
      "id, workspace_id, name, platform, url, description, member_count, industry, location_focus, status, joined_date, rules_notes, relevance_score, tags, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Home
        </Link>

        <Link
          href="/communities"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Communities
        </Link>
      </div>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {community && (
        <section style={{ marginTop: "32px" }}>
          <h1>{community.name}</h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "850px",
              marginBottom: "40px",
            }}
          >
            <p>
              <strong>Platform:</strong> {community.platform}
            </p>

            <p>
              <strong>Status:</strong> {community.status}
            </p>

            <p>
              <strong>URL:</strong>{" "}
              {community.url ? (
                <a
                  href={community.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "white" }}
                >
                  {community.url}
                </a>
              ) : (
                "Not provided"
              )}
            </p>

            <p>
              <strong>Description:</strong>
            </p>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {community.description || "No description provided."}
            </p>

            <p>
              <strong>Member Count:</strong>{" "}
              {community.member_count !== null
                ? Number(community.member_count).toLocaleString()
                : "Not provided"}
            </p>

            <p>
              <strong>Industry:</strong>{" "}
              {community.industry || "Not provided"}
            </p>

            <p>
              <strong>Location Focus:</strong>{" "}
              {community.location_focus || "Not provided"}
            </p>

            <p>
              <strong>Joined Date:</strong>{" "}
              {community.joined_date || "Not provided"}
            </p>

            <p>
              <strong>Rules / Notes:</strong>
            </p>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {community.rules_notes || "No rules or notes provided."}
            </p>

            <p>
              <strong>Relevance Score:</strong>{" "}
              {community.relevance_score !== null
                ? community.relevance_score
                : "Not provided"}
            </p>

            <p>
              <strong>Tags:</strong> {community.tags || "Not provided"}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {community.created_at
                ? new Date(community.created_at).toLocaleString()
                : "Not available"}
            </p>

            <p>
              <strong>Last Updated:</strong>{" "}
              {community.updated_at
                ? new Date(community.updated_at).toLocaleString()
                : "Not available"}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}