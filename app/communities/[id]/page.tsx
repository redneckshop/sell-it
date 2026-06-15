import Link from "next/link";
import { supabase } from "../../lib/supabase";

type RelatedPost = {
  id: string;
  title: string;
  platform: string | null;
  post_type: string | null;
  post_date: string | null;
  comment_count: number | null;
  reaction_count: number | null;
  share_count: number | null;
  follow_up_needed: boolean | null;
  pain_points_found: string | null;
  leads_found: string | null;
  created_at: string | null;
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

  const { data: relatedPostRows, error: relatedPostsError } = await supabase
    .from("posts")
    .select(
      "id, title, platform, post_type, post_date, comment_count, reaction_count, share_count, follow_up_needed, pain_points_found, leads_found, created_at"
    )
    .eq("community_id", id)
    .order("created_at", { ascending: false });

  const relatedPosts = (relatedPostRows ?? []) as RelatedPost[];

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

        {community && (
          <Link
            href={`/communities/${community.id}/edit`}
            style={{
              color: "black",
              backgroundColor: "white",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Edit Community
          </Link>
        )}

        {community && (
          <Link
            href={`/communities/${community.id}/delete`}
            style={{
              color: "black",
              backgroundColor: "#ffdddd",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Delete Community
          </Link>
        )}
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

          <section style={{ maxWidth: "900px" }}>
            <h2>Related Posts</h2>

            <p style={{ color: "#aaa", marginBottom: "20px" }}>
              Posts tracked from this community.
            </p>

            {relatedPostsError && (
              <p style={{ color: "red" }}>
                Related posts error: {relatedPostsError.message}
              </p>
            )}

            {relatedPosts.length === 0 && (
              <p style={{ color: "#aaa" }}>
                No posts have been linked to this community yet.
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {relatedPosts.map((post) => (
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
                  <h3 style={{ marginTop: 0 }}>{post.title}</h3>

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

                  {post.pain_points_found && (
                    <p style={{ color: "#ccc" }}>
                      <strong>Pain Points:</strong>{" "}
                      {post.pain_points_found.length > 140
                        ? `${post.pain_points_found.slice(0, 140)}...`
                        : post.pain_points_found}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}




