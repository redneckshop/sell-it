import Link from "next/link";
import type { CSSProperties } from "react";
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
    new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))
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

function previewText(value: string | null) {
  if (!value) return "No description saved yet.";

  if (value.length > 160) {
    return `${value.slice(0, 160)}...`;
  }

  return value;
}

function initialsFromPainPoint(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function pageStyle(): CSSProperties {
  return {
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#101010",
    color: "white",
    padding: "38px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  };
}

function panelStyle(): CSSProperties {
  return {
    border: "1px solid #2f2f2f",
    background:
      "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
    padding: "16px",
    borderRadius: "14px",
    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
  };
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #3d3d3d",
    backgroundColor: "#111",
    color: "white",
    outline: "none",
  };
}

function fieldLabelStyle(): CSSProperties {
  return {
    display: "block",
    marginBottom: "7px",
    color: "#e5e5e5",
    fontSize: "13px",
    fontWeight: 800,
  };
}

function primaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    backgroundColor: "#7c3aed",
    color: "white",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #8b5cf6",
    boxShadow: "0 12px 24px rgba(124,58,237,0.24)",
  };
}

function secondaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    color: "white",
    border: "1px solid #3d3d3d",
    backgroundColor: "#151515",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
  };
}

function badgeStyle(value: string | null): CSSProperties {
  const normalized = (value ?? "").toLowerCase();

  const backgroundColor =
    normalized.includes("truck") || normalized.includes("lead")
      ? "rgba(124, 58, 237, 0.22)"
      : normalized.includes("paper") || normalized.includes("admin")
        ? "rgba(245, 158, 11, 0.22)"
        : normalized.includes("driver") || normalized.includes("dispatch")
          ? "rgba(59, 130, 246, 0.22)"
          : "rgba(156, 163, 175, 0.18)";

  const color =
    normalized.includes("truck") || normalized.includes("lead")
      ? "#c4b5fd"
      : normalized.includes("paper") || normalized.includes("admin")
        ? "#fcd34d"
        : normalized.includes("driver") || normalized.includes("dispatch")
          ? "#93c5fd"
          : "#d1d5db";

  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor,
    color,
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
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
    <main style={pageStyle()}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "22px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                ...mutedTextStyle(),
                textTransform: "uppercase",
                letterSpacing: "1.8px",
                fontSize: "12px",
                fontWeight: 900,
                margin: "0 0 8px",
              }}
            >
              Intelligence
            </p>

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>
              Pain Points
            </h1>

            <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.5 }}>
              Track recurring business problems discovered through companies,
              contacts, activities, communities, posts, and future AI analysis.
            </p>
          </div>

          <Link href="/pain-points/new" style={primaryButtonStyle()}>
            + Add Pain Point
          </Link>
        </div>

        <form
          action="/pain-points"
          style={{ ...panelStyle(), marginBottom: "18px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <label>
              <span style={fieldLabelStyle()}>Search</span>
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search pain points..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Category</span>
              <select
                name="category"
                defaultValue={categoryFilter}
                style={inputStyle()}
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

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px",
            }}
          >
            <button
              type="submit"
              style={{
                ...primaryButtonStyle(),
                cursor: "pointer",
              }}
            >
              Apply Filters
            </button>

            <a href="/pain-points" style={secondaryButtonStyle()}>
              Clear Filters
            </a>
          </div>
        </form>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <p style={{ ...mutedTextStyle(), margin: 0 }}>{resultCountLabel}</p>

          <p style={{ ...mutedTextStyle(), margin: 0, fontSize: "13px" }}>
            Sorted by newest first
          </p>
        </div>

        {error && (
          <p style={{ color: "#fca5a5", marginTop: "32px" }}>
            Database error: {error.message}
          </p>
        )}

        {!error && allPainPoints.length === 0 && (
          <p style={mutedTextStyle()}>No pain points added yet.</p>
        )}

        {!error && allPainPoints.length > 0 && painPoints.length === 0 && (
          <p>No pain points match the current filters.</p>
        )}

        <div style={{ display: "grid", gap: "10px" }}>
          {painPoints.map((painPoint) => (
            <Link
              key={painPoint.id}
              href={`/pain-points/${painPoint.id}`}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "48px minmax(0, 1.25fr) minmax(190px, 0.85fr) 26px",
                gap: "14px",
                alignItems: "center",
                border: "1px solid #2f2f2f",
                padding: "14px",
                borderRadius: "14px",
                background:
                  "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
                color: "white",
                textDecoration: "none",
                boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#2b2b2b",
                  color: "white",
                  fontWeight: 900,
                  border: "1px solid #3d3d3d",
                }}
              >
                {initialsFromPainPoint(painPoint.name)}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "5px",
                  }}
                >
                  <strong>{painPoint.name}</strong>

                  {painPoint.category && (
                    <span style={badgeStyle(painPoint.category)}>
                      {painPoint.category}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    ...mutedTextStyle(),
                    margin: 0,
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {previewText(painPoint.description)}
                </p>
              </div>

              <div style={{ minWidth: 0 }}>
                <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                  Created: {formatDateTime(painPoint.created_at)}
                </p>

                <p style={{ ...mutedTextStyle(), margin: 0 }}>
                  Updated: {formatDateTime(painPoint.updated_at)}
                </p>
              </div>

              <div
                style={{
                  color: "#a7a7a7",
                  fontSize: "26px",
                  textAlign: "right",
                }}
              >
                ›
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
