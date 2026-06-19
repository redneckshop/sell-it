import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "../lib/supabase";

type SupabaseRelation<T> = T | T[] | null;

type Community = {
  name: string | null;
};

type Post = {
  id: string;
  title: string;
  platform: string | null;
  post_type: string | null;
  post_url: string | null;
  post_date: string | null;
  original_post_text: string | null;
  ai_summary?: string | null;
  pain_points_found?: string | null;
  leads_found?: string | null;
  comment_count: number | null;
  reaction_count: number | null;
  share_count: number | null;
  follow_up_needed: boolean | null;
  tags: string | null;
  created_at: string | null;
  communities: SupabaseRelation<Community>;
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    platform?: string;
    post_type?: string;
    follow_up?: string;
  }>;
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function textValue(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function matchesPostSearch(post: Post, search: string) {
  if (!search) return true;

  const community = singleRelation(post.communities);

  const searchable = [
    post.title,
    post.platform,
    post.post_type,
    post.post_url,
    post.original_post_text,
    post.ai_summary,
    post.pain_points_found,
    post.leads_found,
    post.tags,
    community?.name,
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

function previewText(value: string | null | undefined) {
  if (!value) return "";

  if (value.length > 145) {
    return `${value.slice(0, 145)}...`;
  }

  return value;
}

const STANDARD_POST_PLATFORMS = [
  "Facebook",
  "LinkedIn",
  "Reddit",
  "Forum",
  "Website",
  "Other",
];

const STANDARD_POST_TYPES = [
  "Post",
  "Comment",
  "Question",
  "Complaint",
  "Lead",
  "Market Research",
  "Other",
];

function initialsFromPost(title: string) {
  const parts = title
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
    normalized === "lead" || normalized.includes("follow")
      ? "rgba(245, 158, 11, 0.22)"
      : normalized === "complaint"
        ? "rgba(239, 68, 68, 0.18)"
        : normalized === "market research" || normalized === "question"
          ? "rgba(124, 58, 237, 0.22)"
          : normalized === "facebook" || normalized === "linkedin"
            ? "rgba(59, 130, 246, 0.22)"
            : "rgba(156, 163, 175, 0.18)";

  const color =
    normalized === "lead" || normalized.includes("follow")
      ? "#fcd34d"
      : normalized === "complaint"
        ? "#fca5a5"
        : normalized === "market research" || normalized === "question"
          ? "#c4b5fd"
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

function followUpBadgeStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor: "rgba(245, 158, 11, 0.22)",
    color: "#fcd34d",
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
}

export default async function PostsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const search = (params.q ?? "").trim().toLowerCase();
  const platformFilter = (params.platform ?? "").trim();
  const postTypeFilter = (params.post_type ?? "").trim();
  const followUpFilter = (params.follow_up ?? "").trim();

  const { data: postRows, error } = await supabase
    .from("posts")
    .select("*, communities(name)")
    .order("created_at", { ascending: false });

  const allPosts = (postRows ?? []) as unknown as Post[];

  const posts = allPosts.filter((post) => {
    const matchesFollowUp =
      followUpFilter === "yes"
        ? Boolean(post.follow_up_needed)
        : followUpFilter === "no"
          ? !post.follow_up_needed
          : true;

    return (
      matchesPostSearch(post, search) &&
      (!platformFilter || post.platform === platformFilter) &&
      (!postTypeFilter || post.post_type === postTypeFilter) &&
      matchesFollowUp
    );
  });

  const platforms = uniqueValues([
    ...STANDARD_POST_PLATFORMS,
    ...allPosts.map((post) => post.platform),
  ]);

  const postTypes = uniqueValues([
    ...STANDARD_POST_TYPES,
    ...allPosts.map((post) => post.post_type),
  ]);

  const hasFilters =
    Boolean(search) ||
    Boolean(platformFilter) ||
    Boolean(postTypeFilter) ||
    Boolean(followUpFilter);

  const resultCountLabel = `Showing ${posts.length} posts out of ${allPosts.length} total posts${
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

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>Posts</h1>

            <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.5 }}>
              Track posts made inside communities, including original post text,
              URLs, comments, reactions, leads found, and pain points discovered.
            </p>
          </div>

          <Link href="/posts/new" style={primaryButtonStyle()}>
            + Add Post
          </Link>
        </div>

        <form action="/posts" style={{ ...panelStyle(), marginBottom: "18px" }}>
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
                placeholder="Search posts..."
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
              <span style={fieldLabelStyle()}>Post Type</span>
              <select
                name="post_type"
                defaultValue={postTypeFilter}
                style={inputStyle()}
              >
                <option value="">All</option>
                {postTypes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={fieldLabelStyle()}>Follow-Up Needed</span>
              <select
                name="follow_up"
                defaultValue={followUpFilter}
                style={inputStyle()}
              >
                <option value="">All</option>
                <option value="yes">Yes only</option>
                <option value="no">No only</option>
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

            <a href="/posts" style={secondaryButtonStyle()}>
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

          <Link
            href="/communities"
            style={{
              color: "#c4b5fd",
              fontSize: "13px",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            View Communities →
          </Link>
        </div>

        {error && (
          <p style={{ color: "#fca5a5", marginTop: "32px" }}>
            Database error: {error.message}
          </p>
        )}

        {!error && allPosts.length === 0 && (
          <p style={mutedTextStyle()}>No posts added yet.</p>
        )}

        {!error && allPosts.length > 0 && posts.length === 0 && (
          <p>No posts match the current filters.</p>
        )}

        <div style={{ display: "grid", gap: "10px" }}>
          {posts.map((post) => {
            const community = singleRelation(post.communities);

            return (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "48px minmax(0, 1.25fr) minmax(210px, 0.85fr) 26px",
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
                  {initialsFromPost(post.title)}
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
                    <strong>{post.title}</strong>

                    {post.platform && (
                      <span style={badgeStyle(post.platform)}>
                        {post.platform}
                      </span>
                    )}

                    {post.post_type && (
                      <span style={badgeStyle(post.post_type)}>
                        {post.post_type}
                      </span>
                    )}

                    {post.follow_up_needed && (
                      <span style={followUpBadgeStyle()}>Follow Up Needed</span>
                    )}
                  </div>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 4px" }}>
                    Community: {community?.name || "Not linked"}
                  </p>

                  {post.original_post_text && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {previewText(post.original_post_text)}
                    </p>
                  )}

                  {post.ai_summary && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      AI Summary: {previewText(post.ai_summary)}
                    </p>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Comments: {post.comment_count ?? 0} | Reactions:{" "}
                    {post.reaction_count ?? 0} | Shares: {post.share_count ?? 0}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Post Date: {post.post_date || "Not set"}
                  </p>

                  {post.pain_points_found && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "0 0 6px",
                        wordBreak: "break-word",
                      }}
                    >
                      Pain Points: {previewText(post.pain_points_found)}
                    </p>
                  )}

                  {post.leads_found && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "0 0 6px",
                        wordBreak: "break-word",
                      }}
                    >
                      Leads: {previewText(post.leads_found)}
                    </p>
                  )}

                  {post.tags && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: 0,
                        wordBreak: "break-word",
                      }}
                    >
                      Tags: {post.tags}
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
            );
          })}
        </div>
      </section>
    </main>
  );
}
