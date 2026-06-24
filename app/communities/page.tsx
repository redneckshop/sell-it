import Link from "next/link";
import type { CSSProperties } from "react";
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

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    platform?: string;
    status?: string;
    industry?: string;
    location?: string;
  }>;
};

function textValue(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function includesText(value: string | null | undefined, search: string) {
  if (!search) return true;

  return textValue(value).includes(search);
}

const US_STATES = [
  { name: "Alabama", abbreviation: "AL" },
  { name: "Alaska", abbreviation: "AK" },
  { name: "Arizona", abbreviation: "AZ" },
  { name: "Arkansas", abbreviation: "AR" },
  { name: "California", abbreviation: "CA" },
  { name: "Colorado", abbreviation: "CO" },
  { name: "Connecticut", abbreviation: "CT" },
  { name: "Delaware", abbreviation: "DE" },
  { name: "Florida", abbreviation: "FL" },
  { name: "Georgia", abbreviation: "GA" },
  { name: "Hawaii", abbreviation: "HI" },
  { name: "Idaho", abbreviation: "ID" },
  { name: "Illinois", abbreviation: "IL" },
  { name: "Indiana", abbreviation: "IN" },
  { name: "Iowa", abbreviation: "IA" },
  { name: "Kansas", abbreviation: "KS" },
  { name: "Kentucky", abbreviation: "KY" },
  { name: "Louisiana", abbreviation: "LA" },
  { name: "Maine", abbreviation: "ME" },
  { name: "Maryland", abbreviation: "MD" },
  { name: "Massachusetts", abbreviation: "MA" },
  { name: "Michigan", abbreviation: "MI" },
  { name: "Minnesota", abbreviation: "MN" },
  { name: "Mississippi", abbreviation: "MS" },
  { name: "Missouri", abbreviation: "MO" },
  { name: "Montana", abbreviation: "MT" },
  { name: "Nebraska", abbreviation: "NE" },
  { name: "Nevada", abbreviation: "NV" },
  { name: "New Hampshire", abbreviation: "NH" },
  { name: "New Jersey", abbreviation: "NJ" },
  { name: "New Mexico", abbreviation: "NM" },
  { name: "New York", abbreviation: "NY" },
  { name: "North Carolina", abbreviation: "NC" },
  { name: "North Dakota", abbreviation: "ND" },
  { name: "Ohio", abbreviation: "OH" },
  { name: "Oklahoma", abbreviation: "OK" },
  { name: "Oregon", abbreviation: "OR" },
  { name: "Pennsylvania", abbreviation: "PA" },
  { name: "Rhode Island", abbreviation: "RI" },
  { name: "South Carolina", abbreviation: "SC" },
  { name: "South Dakota", abbreviation: "SD" },
  { name: "Tennessee", abbreviation: "TN" },
  { name: "Texas", abbreviation: "TX" },
  { name: "Utah", abbreviation: "UT" },
  { name: "Vermont", abbreviation: "VT" },
  { name: "Virginia", abbreviation: "VA" },
  { name: "Washington", abbreviation: "WA" },
  { name: "West Virginia", abbreviation: "WV" },
  { name: "Wisconsin", abbreviation: "WI" },
  { name: "Wyoming", abbreviation: "WY" },
];

function normalizeLocationText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function includesWholeLocationTerm(value: string | null | undefined, search: string) {
  const cleanValue = normalizeLocationText(value);
  const cleanSearch = normalizeLocationText(search);

  if (!cleanSearch) return true;
  if (!cleanValue) return false;

  return ` ${cleanValue} `.includes(` ${cleanSearch} `);
}

function matchesLocationFocus(value: string | null | undefined, search: string) {
  const cleanSearch = normalizeLocationText(search);

  if (!cleanSearch) return true;

  const cleanValue = normalizeLocationText(value);

  if (!cleanValue) return false;

  const matchingState = US_STATES.find((state) => {
    return (
      normalizeLocationText(state.name) === cleanSearch ||
      state.abbreviation.toLowerCase() === cleanSearch
    );
  });

  if (matchingState) {
    return (
      includesWholeLocationTerm(value, matchingState.name) ||
      includesWholeLocationTerm(value, matchingState.abbreviation)
    );
  }

  return includesWholeLocationTerm(value, cleanSearch);
}

function matchesCommunitySearch(community: Community, search: string) {
  if (!search) return true;

  const searchable = [
    community.name,
    community.platform,
    community.url,
    community.description,
    community.industry,
    community.location_focus,
    community.status,
    community.tags,
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

const STANDARD_COMMUNITY_PLATFORMS = [
  "Facebook",
  "LinkedIn",
  "Reddit",
  "Forum",
  "Website",
  "Other",
];

const STANDARD_COMMUNITY_STATUSES = [
  "Watching",
  "Joined",
  "Active",
  "Paused",
  "Not Relevant",
];

function initialsFromCommunity(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function previewText(value: string | null) {
  if (!value) return "";

  if (value.length > 145) {
    return `${value.slice(0, 145)}...`;
  }

  return value;
}

function pageStyle(): CSSProperties {
  return {
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#101010",
    color: "white",
    padding: "clamp(12px, 4vw, 38px)",
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
    normalized === "active" || normalized === "joined"
      ? "rgba(34, 197, 94, 0.20)"
      : normalized === "watching"
        ? "rgba(124, 58, 237, 0.22)"
        : normalized === "paused"
          ? "rgba(245, 158, 11, 0.22)"
          : normalized === "not relevant"
            ? "rgba(239, 68, 68, 0.18)"
            : normalized === "facebook" || normalized === "linkedin"
              ? "rgba(59, 130, 246, 0.22)"
              : "rgba(156, 163, 175, 0.18)";

  const color =
    normalized === "active" || normalized === "joined"
      ? "#86efac"
      : normalized === "watching"
        ? "#c4b5fd"
        : normalized === "paused"
          ? "#fcd34d"
          : normalized === "not relevant"
            ? "#fca5a5"
            : normalized === "facebook" || normalized === "linkedin"
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

export default async function CommunitiesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const search = (params.q ?? "").trim().toLowerCase();
  const platformFilter = (params.platform ?? "").trim();
  const statusFilter = (params.status ?? "").trim();
  const industrySearch = (params.industry ?? "").trim().toLowerCase();
  const locationSearch = (params.location ?? "").trim().toLowerCase();

  const { data: communityRows, error } = await supabase
    .from("communities")
    .select(
      "id, name, platform, url, description, member_count, industry, location_focus, status, joined_date, relevance_score, tags, created_at"
    )
    .order("created_at", { ascending: false });

  const allCommunities: Community[] = communityRows ?? [];

  const communities = allCommunities.filter((community) => {
    return (
      matchesCommunitySearch(community, search) &&
      (!platformFilter || community.platform === platformFilter) &&
      (!statusFilter || community.status === statusFilter) &&
      includesText(community.industry, industrySearch) &&
      matchesLocationFocus(community.location_focus, locationSearch)
    );
  });

  const platforms = uniqueValues([
    ...STANDARD_COMMUNITY_PLATFORMS,
    ...allCommunities.map((community) => community.platform),
  ]);

  const statuses = uniqueValues([
    ...STANDARD_COMMUNITY_STATUSES,
    ...allCommunities.map((community) => community.status),
  ]);

  const hasFilters =
    Boolean(search) ||
    Boolean(platformFilter) ||
    Boolean(statusFilter) ||
    Boolean(industrySearch) ||
    Boolean(locationSearch);

  const resultCountLabel = `Showing ${communities.length} communities out of ${allCommunities.length} total communities${
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
              Communities
            </h1>

            <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.5 }}>
              Track Facebook groups, LinkedIn groups, Reddit communities,
              forums, and other places where market intelligence can be gathered.
            </p>
          </div>

          <Link href="/communities/new" style={primaryButtonStyle()}>
            + Add Community
          </Link>
        </div>

        <form
          action="/communities"
          style={{ ...panelStyle(), marginBottom: "18px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <label>
              <span style={fieldLabelStyle()}>Search</span>
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search communities..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Platform</span>
              <select
                name="platform"
                defaultValue={platformFilter}
                style={inputStyle()}
              >
                <option value="">All</option>
                {platforms.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={fieldLabelStyle()}>Status</span>
              <select
                name="status"
                defaultValue={statusFilter}
                style={inputStyle()}
              >
                <option value="">All</option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={fieldLabelStyle()}>Industry</span>
              <input
                name="industry"
                defaultValue={params.industry ?? ""}
                placeholder="Trucking, aggregate..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Location Focus</span>
              <input
                name="location"
                defaultValue={params.location ?? ""}
                placeholder="Idaho, Spokane..."
                style={inputStyle()}
              />
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

            <a href="/communities" style={secondaryButtonStyle()}>
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

        {!error && allCommunities.length === 0 && (
          <p style={mutedTextStyle()}>No communities added yet.</p>
        )}

        {!error && allCommunities.length > 0 && communities.length === 0 && (
          <p>No communities match the current filters.</p>
        )}

        <div style={{ display: "grid", gap: "10px" }}>
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.id}`}
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
                {initialsFromCommunity(community.name)}
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
                  <strong>{community.name}</strong>

                  <span style={badgeStyle(community.platform)}>
                    {community.platform}
                  </span>

                  <span style={badgeStyle(community.status)}>
                    {community.status}
                  </span>
                </div>

                {community.description && (
                  <p
                    style={{
                      ...mutedTextStyle(),
                      margin: "0 0 8px",
                      lineHeight: 1.4,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {previewText(community.description)}
                  </p>
                )}

                <p style={{ ...mutedTextStyle(), margin: "0 0 4px" }}>
                  Industry: {community.industry || "Not set"}
                </p>

                <p style={{ ...mutedTextStyle(), margin: 0 }}>
                  Location Focus: {community.location_focus || "Not set"}
                </p>
              </div>

              <div style={{ minWidth: 0 }}>
                <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                  Members:{" "}
                  {community.member_count !== null
                    ? Number(community.member_count).toLocaleString()
                    : "Not set"}
                </p>

                <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                  Relevance:{" "}
                  {community.relevance_score !== null
                    ? community.relevance_score
                    : "Not set"}
                </p>

                {community.tags && (
                  <p
                    style={{
                      ...mutedTextStyle(),
                      margin: 0,
                      overflowWrap: "anywhere",
                    }}
                  >
                    Tags: {community.tags}
                  </p>
                )}
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

