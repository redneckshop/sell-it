import Link from "next/link";
import { supabase } from "../lib/supabase";

type PainPoint = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default async function PainPointsPage() {
  const { data: painPointRows, error } = await supabase
    .from("pain_points")
    .select("id, name, description, category, created_at, updated_at")
    .order("created_at", { ascending: false });

  const painPoints = (painPointRows ?? []) as PainPoint[];

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
          href="/pain-points/new"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Pain Point
        </Link>
      </div>

      <h1>Pain Points</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Track recurring business problems discovered through companies,
        contacts, activities, communities, posts, and future AI analysis.
      </p>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {painPoints.length === 0 && (
        <p style={{ color: "#aaa" }}>No pain points added yet.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {painPoints.map((painPoint) => (
          <Link
            key={painPoint.id}
            href={`/pain-points/${painPoint.id}`}
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
            <h2 style={{ marginTop: 0 }}>{painPoint.name}</h2>

            {painPoint.category && (
              <p>
                <strong>Category:</strong> {painPoint.category}
              </p>
            )}

            <p style={{ color: "#ccc", whiteSpace: "pre-wrap" }}>
              {painPoint.description || "No description saved yet."}
            </p>

            <p style={{ color: "#aaa", fontSize: "14px" }}>
              Created:{" "}
              {painPoint.created_at
                ? new Date(painPoint.created_at).toLocaleString()
                : "Not available"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}