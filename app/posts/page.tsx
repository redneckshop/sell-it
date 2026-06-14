import Link from "next/link";
import { supabase } from "../lib/supabase";

type Post = {
  id: string;
  title: string;
  platform: string | null;
  post_type: string | null;
  post_url: string | null;
  post_date: string | null;
  original_post_text: string | null;
  comment_count: number | null;
  reaction_count: number | null;
  share_count: number | null;
  follow_up_needed: boolean | null;
  tags: string | null;
  created_at: string | null;
  communities: {
    name: string | null;
  } | null;
};

export default async function PostsPage() {
  const { data: postRows, error } = await supabase
    .from("posts")
    .select(
      "id, title, platform, post_type, post_url, post_date, original_post_text, comment_count, reaction_count, share_count, follow_up_needed, tags, created_at, communities(name)"
    )
    .order("created_at", { ascending: false });

  const posts = (postRows ?? []) as Post[];

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

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Track posts made inside communities, including original post text,
        URLs, screenshots, comments, reactions, leads found, and pain points
        discovered.
      </p>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {posts.length === 0 && (
        <p style={{ color: "#aaa" }}>No posts added yet.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {posts.map((post) => (
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

            {post.communities?.name && (
              <p>
                <strong>Community:</strong> {post.communities.name}
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
                {post.original_post_text.length > 180
                  ? `${post.original_post_text.slice(0, 180)}...`
                  : post.original_post_text}
              </p>
            )}

            {post.tags && (
              <p style={{ color: "#aaa" }}>
                <strong>Tags:</strong> {post.tags}
              </p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}