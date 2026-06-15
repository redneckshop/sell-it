import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";

type Post = {
  id: string;
  workspace_id: string;
  community_id: string | null;
  title: string;
  platform: string | null;
  post_type: string | null;
  post_url: string | null;
  post_date: string | null;
  original_post_text: string | null;
  screenshot_url: string | null;
  comment_count: number | null;
  reaction_count: number | null;
  share_count: number | null;
  last_checked_date: string | null;
  ai_summary: string | null;
  pain_points_found: string | null;
  leads_found: string | null;
  follow_up_needed: boolean | null;
  tags: string | null;
  created_at: string | null;
  updated_at: string | null;
  communities: {
    id: string;
    name: string | null;
    platform: string | null;
    url: string | null;
  } | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: postRow, error } = await supabase
    .from("posts")
    .select(
      "id, workspace_id, community_id, title, platform, post_type, post_url, post_date, original_post_text, screenshot_url, comment_count, reaction_count, share_count, last_checked_date, ai_summary, pain_points_found, leads_found, follow_up_needed, tags, created_at, updated_at, communities(id, name, platform, url)"
    )
    .eq("id", id)
    .single();

  const post = postRow as Post | null;

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
          href="/posts"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Posts
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

        {post && (
          <Link
            href={`/posts/${post.id}/edit`}
            style={{
              color: "black",
              backgroundColor: "white",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Edit Post
          </Link>
        )}

        {post && (
          <Link
            href={`/posts/${post.id}/delete`}
            style={{
              color: "black",
              backgroundColor: "#ffdddd",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Delete Post
          </Link>
        )}

        {post?.communities?.id && (
          <Link
            href={`/communities/${post.communities.id}`}
            style={{
              color: "black",
              backgroundColor: "white",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Back to Community
          </Link>
        )}
      </div>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {!post && !error && <p style={{ color: "#aaa" }}>Post not found.</p>}

      {post && (
        <section style={{ marginTop: "32px" }}>
          <h1>{post.title}</h1>

          {post.follow_up_needed && (
            <p style={{ color: "#ffcc66", fontWeight: "bold" }}>
              Follow-up needed
            </p>
          )}

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "900px",
              marginBottom: "32px",
            }}
          >
            {post.communities?.name && (
              <p>
                <strong>Community:</strong>{" "}
                <Link
                  href={`/communities/${post.communities.id}`}
                  style={{ color: "#8ab4ff" }}
                >
                  {post.communities.name}
                </Link>
              </p>
            )}

            {post.platform && (
              <p>
                <strong>Platform:</strong> {post.platform}
              </p>
            )}

            {post.post_type && (
              <p>
                <strong>Post Type:</strong> {post.post_type}
              </p>
            )}

            {post.post_url && (
              <p>
                <strong>Post URL:</strong>{" "}
                <a
                  href={post.post_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#8ab4ff" }}
                >
                  Open post
                </a>
              </p>
            )}

            {post.post_date && (
              <p>
                <strong>Post Date:</strong> {post.post_date}
              </p>
            )}

            {post.last_checked_date && (
              <p>
                <strong>Last Checked:</strong> {post.last_checked_date}
              </p>
            )}

            <p>
              <strong>Comments:</strong> {post.comment_count ?? 0}{" "}
              <strong>Reactions:</strong> {post.reaction_count ?? 0}{" "}
              <strong>Shares:</strong> {post.share_count ?? 0}
            </p>

            {post.screenshot_url && (
              <p>
                <strong>Screenshot URL:</strong>{" "}
                <a
                  href={post.screenshot_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#8ab4ff" }}
                >
                  Open screenshot
                </a>
              </p>
            )}

            {post.tags && (
              <p>
                <strong>Tags:</strong> {post.tags}
              </p>
            )}
          </div>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "900px",
              marginBottom: "32px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Original Post</h2>
            <p style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
              {post.original_post_text || "No original post text saved."}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "900px",
              marginBottom: "32px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Market Intelligence</h2>

            <h3>AI Summary</h3>
            <p style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
              {post.ai_summary || "No AI summary yet."}
            </p>

            <h3>Pain Points Found</h3>
            <p style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
              {post.pain_points_found || "No pain points saved yet."}
            </p>

            <h3>Leads Found</h3>
            <p style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
              {post.leads_found || "No leads saved yet."}
            </p>
          </div>

          <AttachmentsSection
            workspaceId={post.workspace_id}
            relationColumn="related_post_id"
            relationId={post.id}
          />
        </section>
      )}
    </main>
  );
}


