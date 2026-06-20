import Link from "next/link";
import type { CSSProperties } from "react";
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

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
  fontSize: "13px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
};

const subtitleStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#cbd5e1",
  fontSize: "15px",
  lineHeight: 1.55,
  maxWidth: "780px",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "center",
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 15px",
  borderRadius: "999px",
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  boxShadow: "0 18px 36px rgba(124, 58, 237, 0.24)",
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 15px",
  borderRadius: "999px",
  color: "#e2e8f0",
  backgroundColor: "rgba(15, 23, 42, 0.82)",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(148, 163, 184, 0.28)",
};

const dangerLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 15px",
  borderRadius: "999px",
  color: "#fecdd3",
  backgroundColor: "rgba(127, 29, 29, 0.34)",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(251, 113, 133, 0.45)",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: "20px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const sectionCardStyle: CSSProperties = {
  ...cardStyle,
  marginBottom: "22px",
};

const detailGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
  marginBottom: "22px",
};

const detailTileStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "16px",
  padding: "14px",
  backgroundColor: "rgba(15, 23, 42, 0.56)",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: 800,
};

const valueStyle: CSSProperties = {
  color: "#f8fafc",
  lineHeight: 1.45,
};

const mutedTextStyle: CSSProperties = {
  color: "#94a3b8",
};

const bodyTextStyle: CSSProperties = {
  whiteSpace: "pre-wrap",
  color: "#dbeafe",
  lineHeight: 1.7,
  marginBottom: 0,
};

const externalLinkStyle: CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 800,
  textDecoration: "none",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "7px 11px",
  color: "#fde68a",
  backgroundColor: "rgba(113, 63, 18, 0.32)",
  border: "1px solid rgba(250, 204, 21, 0.28)",
  fontSize: "13px",
  fontWeight: 800,
};

const statGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  marginBottom: "22px",
};

const statCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "rgba(15, 23, 42, 0.62)",
};

const statNumberStyle: CSSProperties = {
  margin: "0 0 4px",
  fontSize: "26px",
  fontWeight: 900,
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "22px",
};

function formatDate(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function optionalValue(value: string | null) {
  return value && value.trim().length > 0 ? value : "Not provided";
}

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
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Market Intelligence / Post</p>
            <h1 style={titleStyle}>{post ? post.title : "Post not found"}</h1>
            <p style={subtitleStyle}>
              Review the original post, social engagement, AI summary, pain
              points, leads, and related community context.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href="/posts" style={secondaryLinkStyle}>
              Back to Posts
            </Link>

            <Link href="/posts/new" style={primaryLinkStyle}>
              Add Post
            </Link>

            {post && (
              <Link href={`/posts/${post.id}/edit`} style={secondaryLinkStyle}>
                Edit Post
              </Link>
            )}

            {post && (
              <Link href={`/posts/${post.id}/delete`} style={dangerLinkStyle}>
                Delete Post
              </Link>
            )}

            {post?.communities?.id && (
              <Link
                href={`/communities/${post.communities.id}`}
                style={secondaryLinkStyle}
              >
                Back to Community
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div
            style={{
              ...cardStyle,
              borderColor: "rgba(248, 113, 113, 0.32)",
              background:
                "linear-gradient(135deg, rgba(127, 29, 29, 0.28), rgba(15, 23, 42, 0.94))",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Database error</h2>
            <p style={{ color: "#fecaca", marginBottom: 0 }}>
              {error.message}
            </p>
          </div>
        )}

        {!post && !error && (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>No post found</h2>
            <p style={{ ...mutedTextStyle, marginBottom: 0 }}>
              This post may have been deleted, archived, or the link may be
              incorrect.
            </p>
          </div>
        )}

        {post && (
          <>
            {post.follow_up_needed && (
              <div style={{ marginBottom: "16px" }}>
                <span style={badgeStyle}>Follow-up needed</span>
              </div>
            )}

            <div style={statGridStyle}>
              <div style={statCardStyle}>
                <p style={statNumberStyle}>{post.comment_count ?? 0}</p>
                <div style={labelStyle}>Comments</div>
              </div>

              <div style={statCardStyle}>
                <p style={statNumberStyle}>{post.reaction_count ?? 0}</p>
                <div style={labelStyle}>Reactions</div>
              </div>

              <div style={statCardStyle}>
                <p style={statNumberStyle}>{post.share_count ?? 0}</p>
                <div style={labelStyle}>Shares</div>
              </div>
            </div>

            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Post Details</h2>

              <div style={detailGridStyle}>
                <div style={detailTileStyle}>
                  <div style={labelStyle}>Community</div>
                  <div style={valueStyle}>
                    {post.communities?.name ? (
                      <Link
                        href={`/communities/${post.communities.id}`}
                        style={externalLinkStyle}
                      >
                        {post.communities.name}
                      </Link>
                    ) : (
                      "Not linked"
                    )}
                  </div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Platform</div>
                  <div style={valueStyle}>{optionalValue(post.platform)}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Post Type</div>
                  <div style={valueStyle}>{optionalValue(post.post_type)}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Post Date</div>
                  <div style={valueStyle}>{formatDate(post.post_date)}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Last Checked</div>
                  <div style={valueStyle}>
                    {formatDate(post.last_checked_date)}
                  </div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Tags</div>
                  <div style={valueStyle}>{optionalValue(post.tags)}</div>
                </div>
              </div>

              <div style={detailGridStyle}>
                <div style={detailTileStyle}>
                  <div style={labelStyle}>Post Link</div>
                  <div style={valueStyle}>
                    {post.post_url ? (
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noreferrer"
                        style={externalLinkStyle}
                      >
                        Open post
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Screenshot</div>
                  <div style={valueStyle}>
                    {post.screenshot_url ? (
                      <a
                        href={post.screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        style={externalLinkStyle}
                      >
                        Open screenshot
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Community URL</div>
                  <div style={valueStyle}>
                    {post.communities?.url ? (
                      <a
                        href={post.communities.url}
                        target="_blank"
                        rel="noreferrer"
                        style={externalLinkStyle}
                      >
                        Open community
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Original Post</h2>
              <p
                style={{
                  ...bodyTextStyle,
                  color: post.original_post_text ? "#dbeafe" : "#94a3b8",
                }}
              >
                {post.original_post_text || "No original post text saved."}
              </p>
            </div>

            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Market Intelligence</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "14px",
                }}
              >
                <div style={detailTileStyle}>
                  <h3 style={{ marginTop: 0 }}>AI Summary</h3>
                  <p
                    style={{
                      ...bodyTextStyle,
                      color: post.ai_summary ? "#dbeafe" : "#94a3b8",
                    }}
                  >
                    {post.ai_summary || "No AI summary yet."}
                  </p>
                </div>

                <div style={detailTileStyle}>
                  <h3 style={{ marginTop: 0 }}>Pain Points Found</h3>
                  <p
                    style={{
                      ...bodyTextStyle,
                      color: post.pain_points_found ? "#dbeafe" : "#94a3b8",
                    }}
                  >
                    {post.pain_points_found || "No pain points saved yet."}
                  </p>
                </div>

                <div style={detailTileStyle}>
                  <h3 style={{ marginTop: 0 }}>Leads Found</h3>
                  <p
                    style={{
                      ...bodyTextStyle,
                      color: post.leads_found ? "#dbeafe" : "#94a3b8",
                    }}
                  >
                    {post.leads_found || "No leads saved yet."}
                  </p>
                </div>
              </div>
            </div>

            <AttachmentsSection
              workspaceId={post.workspace_id}
              relationColumn="related_post_id"
              relationId={post.id}
            />
          </>
        )}
      </section>
    </main>
  );
}