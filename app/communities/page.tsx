import Link from "next/link";
import { supabase } from "../lib/supabase";

type Community = {
  id: string;
  name: string;
  platform: string;
  url: string | null;
  description: string | null;
  member_count: number | null;
  industry: string | null;
  location_focus: string | null;
  status: string;
  joined_date: string | null;
  relevance_score: number | null;
  tags: string | null;
  created_at: string | null;
};

export default async function CommunitiesPage() {
  const { data: communityRows, error } = await supabase
    .from("communities")
    .select(
      "id, name, platform, url, description, member_count, industry, location_focus, status, joined_date, relevance_score, tags, created_at"
    )
    .order("created_at", { ascending: false });

  const communities: Community[] = communityRows ?? [];

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
          href="/communities/new"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Community
        </Link>
      </div>

      <h1>Communities</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Track Facebook groups, LinkedIn groups, Reddit communities, forums, and
        other places where market intelligence can be gathered.
      </p>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {communities.length === 0 && (
        <p style={{ color: "#aaa" }}>No communities added yet.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {communities.map((community) => (
          <Link
            key={community.id}
            href={`/communities/${community.id}`}
            style={{
              display: "block",
              border: "1px solid #333",
              padding: "18px",
              borderRadius: "10px",
              backgroundColor: "#1a1a1a",
              color: "white",
              textDecoration: "none",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{community.name}</h2>

            <p>
              <strong>Platform:</strong> {community.platform}
            </p>

            <p>
              <strong>Status:</strong> {community.status}
            </p>

            {community.member_count !== null && (
              <p>
                <strong>Members:</strong>{" "}
                {Number(community.member_count).toLocaleString()}
              </p>
            )}

            {community.industry && (
              <p>
                <strong>Industry:</strong> {community.industry}
              </p>
            )}

            {community.location_focus && (
              <p>
                <strong>Location Focus:</strong> {community.location_focus}
              </p>
            )}

            {community.relevance_score !== null && (
              <p>
                <strong>Relevance Score:</strong> {community.relevance_score}
              </p>
            )}

            {community.description && (
              <p style={{ color: "#aaa" }}>
                {community.description.length > 150
                  ? `${community.description.slice(0, 150)}...`
                  : community.description}
              </p>
            )}

            {community.tags && (
              <p>
                <strong>Tags:</strong> {community.tags}
              </p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}