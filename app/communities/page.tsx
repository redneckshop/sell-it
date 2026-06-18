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
    new Set(
      values
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
    )
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

      <p style={{ color: "#aaa", marginBottom: "24px" }}>
        Track Facebook groups, LinkedIn groups, Reddit communities, forums, and
        other places where market intelligence can be gathered.
      </p>

      <form
        action="/communities"
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
              Platform
            </span>
            <select
              name="platform"
              defaultValue={platformFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
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
            <span style={{ display: "block", marginBottom: "6px" }}>
              Status
            </span>
            <select
              name="status"
              defaultValue={statusFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
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
            <span style={{ display: "block", marginBottom: "6px" }}>
              Industry
            </span>
            <input
              name="industry"
              defaultValue={params.industry ?? ""}
              placeholder="Trucking, aggregate..."
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
              Location Focus
            </span>
            <input
              name="location"
              defaultValue={params.location ?? ""}
              placeholder="Idaho, Spokane..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            />
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
            href="/communities"
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

      {!error && allCommunities.length === 0 && (
        <p style={{ color: "#aaa" }}>No communities added yet.</p>
      )}

      {!error && allCommunities.length > 0 && communities.length === 0 && (
        <p>No communities match the current filters.</p>
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
