import Link from "next/link";
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
    new Set(
      values
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function previewText(value: string | null | undefined) {
  if (!value) return "";

  if (value.length > 180) {
    return `${value.slice(0, 180)}...`;
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
          href="/posts/new"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Post
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
          Communities
        </Link>
      </div>

      <h1>Posts</h1>

      <p style={{ color: "#aaa", marginBottom: "24px" }}>
        Track posts made inside communities, including original post text,
        URLs, screenshots, comments, reactions, leads found, and pain points
        discovered.
      </p>

      <form
        action="/posts"
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
              Post Type
            </span>
            <select
              name="post_type"
              defaultValue={postTypeFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
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
            <span style={{ display: "block", marginBottom: "6px" }}>
              Follow-Up Needed
            </span>
            <select
              name="follow_up"
              defaultValue={followUpFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              <option value="yes">Yes only</option>
              <option value="no">No only</option>
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
            href="/posts"
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

      {!error && allPosts.length === 0 && (
        <p style={{ color: "#aaa" }}>No posts added yet.</p>
      )}

      {!error && allPosts.length > 0 && posts.length === 0 && (
        <p>No posts match the current filters.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {posts.map((post) => {
          const community = singleRelation(post.communities);

          return (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
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
              <h2 style={{ marginTop: 0 }}>{post.title}</h2>

              {community?.name && (
                <p>
                  <strong>Community:</strong> {community.name}
                </p>
              )}

              {post.platform && (
                <p>
                  <strong>Platform:</strong> {post.platform}
                </p>
              )}

              {post.post_type && (
                <p>
                  <strong>Type:</strong> {post.post_type}
                </p>
              )}

              {post.post_date && (
                <p>
                  <strong>Post Date:</strong> {post.post_date}
                </p>
              )}

              <p>
                <strong>Comments:</strong> {post.comment_count ?? 0}{" "}
                <strong>Reactions:</strong> {post.reaction_count ?? 0}{" "}
                <strong>Shares:</strong> {post.share_count ?? 0}
              </p>

              {post.follow_up_needed && (
                <p style={{ color: "#ffcc66", fontWeight: "bold" }}>
                  Follow-up needed
                </p>
              )}

              {post.original_post_text && (
                <p style={{ color: "#ccc" }}>
                  {previewText(post.original_post_text)}
                </p>
              )}

              {post.ai_summary && (
                <p style={{ color: "#ccc" }}>
                  <strong>AI Summary:</strong> {previewText(post.ai_summary)}
                </p>
              )}

              {post.pain_points_found && (
                <p style={{ color: "#ccc" }}>
                  <strong>Pain Points:</strong>{" "}
                  {previewText(post.pain_points_found)}
                </p>
              )}

              {post.leads_found && (
                <p style={{ color: "#ccc" }}>
                  <strong>Leads:</strong> {previewText(post.leads_found)}
                </p>
              )}

              {post.tags && (
                <p style={{ color: "#aaa" }}>
                  <strong>Tags:</strong> {post.tags}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
