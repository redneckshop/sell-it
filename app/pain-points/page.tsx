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

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
  }>;
};

function textValue(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function matchesPainPointSearch(painPoint: PainPoint, search: string) {
  if (!search) return true;

  const searchable = [
    painPoint.name,
    painPoint.description,
    painPoint.category,
  ]
    .map((value) => textValue(value))
    .join(" ");

  return searchable.includes(search);
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function PainPointsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const search = (params.q ?? "").trim().toLowerCase();
  const categoryFilter = (params.category ?? "").trim();

  const { data: painPointRows, error } = await supabase
    .from("pain_points")
    .select("id, name, description, category, created_at, updated_at")
    .order("created_at", { ascending: false });

  const allPainPoints = (painPointRows ?? []) as PainPoint[];

  const painPoints = allPainPoints.filter((painPoint) => {
    return (
      matchesPainPointSearch(painPoint, search) &&
      (!categoryFilter || painPoint.category === categoryFilter)
    );
  });

  const categories = uniqueValues(
    allPainPoints.map((painPoint) => painPoint.category)
  );

  const hasFilters = Boolean(search) || Boolean(categoryFilter);

  const resultCountLabel = `Showing ${painPoints.length} pain points out of ${allPainPoints.length} total pain points${
    hasFilters ? " with current filters" : ""
  }`;

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

      <p style={{ color: "#aaa", marginBottom: "24px" }}>
        Track recurring business problems discovered through companies,
        contacts, activities, communities, posts, and future AI analysis.
      </p>

      <form
        action="/pain-points"
        style={{
          border: "1px solid #333",
          backgroundColor: "#181818",
          padding: "16px",
          borderRadius: "10px",
          marginBottom: "18px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Search
            </span>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Keyword"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Category
            </span>
            <select
              name="category"
              defaultValue={categoryFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#f5d76e",
              color: "black",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>

          <a
            href="/pain-points"
            style={{
              color: "white",
              border: "1px solid #555",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Clear Filters
          </a>
        </div>
      </form>

      <p style={{ color: "#aaa", marginBottom: "18px" }}>
        {resultCountLabel}
      </p>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {!error && allPainPoints.length === 0 && (
        <p style={{ color: "#aaa" }}>No pain points added yet.</p>
      )}

      {!error && allPainPoints.length > 0 && painPoints.length === 0 && (
        <p>No pain points match the current filters.</p>
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
              Created: {formatDateTime(painPoint.created_at)}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
