import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase";

type Community = {
  id: string;
  workspace_id: string;
  name: string;
  platform: string | null;
  url: string | null;
  description: string | null;
  member_count: number | null;
  industry: string | null;
  location_focus: string | null;
  status: string | null;
  joined_date: string | null;
  rules_notes: string | null;
  relevance_score: number | null;
  tags: string | null;
  created_at: string | null;
  updated_at: string | null;
};

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
  marginTop: "18px",
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

const postGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
};

const postCardStyle: CSSProperties = {
  display: "block",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: "18px",
  borderRadius: "18px",
  backgroundColor: "rgba(15, 23, 42, 0.64)",
  color: "#f8fafc",
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

function formatNumber(value: number | null) {
  return value !== null ? Number(value).toLocaleString() : "Not provided";
}

function previewText(value: string | null, maxLength = 140) {
  if (!value || value.trim().length === 0) return "";

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: communityRow, error } = await supabase
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

  const community = communityRow as Community | null;
  const relatedPosts = (relatedPostRows ?? []) as RelatedPost[];

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Market Intelligence / Community</p>
            <h1 style={titleStyle}>
              {community ? community.name : "Community not found"}
            </h1>
            <p style={subtitleStyle}>
              Review community fit, rules, relevance, audience focus, and posts
              being tracked from this source.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href="/communities" style={secondaryLinkStyle}>
              Back to Communities
            </Link>

            <Link href="/communities/new" style={primaryLinkStyle}>
              Add Community
            </Link>

            <Link href="/posts/new" style={secondaryLinkStyle}>
              Add Post
            </Link>

            {community && (
              <Link
                href={`/communities/${community.id}/edit`}
                style={secondaryLinkStyle}
              >
                Edit Community
              </Link>
            )}

            {community && (
              <Link
                href={`/communities/${community.id}/delete`}
                style={dangerLinkStyle}
              >
                Delete Community
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

        {!community && !error && (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>No community found</h2>
            <p style={{ ...mutedTextStyle, marginBottom: 0 }}>
              This community may have been deleted, archived, or the link may be
              incorrect.
            </p>
          </div>
        )}

        {community && (
          <>
            <div style={statGridStyle}>
              <div style={statCardStyle}>
                <p style={statNumberStyle}>{formatNumber(community.member_count)}</p>
                <div style={labelStyle}>Members</div>
              </div>

              <div style={statCardStyle}>
                <p style={statNumberStyle}>
                  {community.relevance_score !== null
                    ? community.relevance_score
                    : "—"}
                </p>
                <div style={labelStyle}>Relevance Score</div>
              </div>

              <div style={statCardStyle}>
                <p style={statNumberStyle}>{relatedPosts.length}</p>
                <div style={labelStyle}>Tracked Posts</div>
              </div>
            </div>

            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Community Details</h2>

              <div style={detailGridStyle}>
                <div style={detailTileStyle}>
                  <div style={labelStyle}>Platform</div>
                  <div style={valueStyle}>{optionalValue(community.platform)}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Status</div>
                  <div style={valueStyle}>{optionalValue(community.status)}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Industry</div>
                  <div style={valueStyle}>{optionalValue(community.industry)}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Location Focus</div>
                  <div style={valueStyle}>
                    {optionalValue(community.location_focus)}
                  </div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Joined Date</div>
                  <div style={valueStyle}>
                    {optionalValue(community.joined_date)}
                  </div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Tags</div>
                  <div style={valueStyle}>{optionalValue(community.tags)}</div>
                </div>
              </div>

              <div style={detailGridStyle}>
                <div style={detailTileStyle}>
                  <div style={labelStyle}>Community URL</div>
                  <div style={valueStyle}>
                    {community.url ? (
                      <a
                        href={community.url}
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

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Created</div>
                  <div style={valueStyle}>{formatDate(community.created_at)}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Last Updated</div>
                  <div style={valueStyle}>{formatDate(community.updated_at)}</div>
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
                <div style={labelStyle}>Description</div>
                <p
                  style={{
                    ...bodyTextStyle,
                    color: community.description ? "#dbeafe" : "#94a3b8",
                  }}
                >
                  {community.description || "No description provided."}
                </p>
              </div>
            </div>

            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Rules / Notes</h2>
              <p
                style={{
                  ...bodyTextStyle,
                  color: community.rules_notes ? "#dbeafe" : "#94a3b8",
                }}
              >
                {community.rules_notes || "No rules or notes provided."}
              </p>
            </div>

            <section style={sectionCardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  alignItems: "flex-end",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h2 style={sectionTitleStyle}>Related Posts</h2>
                  <p style={{ ...mutedTextStyle, margin: 0 }}>
                    Posts tracked from this community.
                  </p>
                </div>

                <Link href="/posts/new" style={primaryLinkStyle}>
                  Add Post
                </Link>
              </div>

              {relatedPostsError && (
                <div
                  style={{
                    border: "1px solid rgba(248, 113, 113, 0.32)",
                    backgroundColor: "rgba(127, 29, 29, 0.24)",
                    color: "#fecaca",
                    padding: "12px 14px",
                    borderRadius: "16px",
                    marginBottom: "16px",
                  }}
                >
                  Related posts error: {relatedPostsError.message}
                </div>
              )}

              {relatedPosts.length === 0 && (
                <p style={mutedTextStyle}>
                  No posts have been linked to this community yet.
                </p>
              )}

              <div style={postGridStyle}>
                {relatedPosts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`} style={postCardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <h3 style={{ margin: 0, lineHeight: 1.25 }}>
                        {post.title}
                      </h3>

                      {post.follow_up_needed && (
                        <span style={badgeStyle}>Follow-up</span>
                      )}
                    </div>

                    <div style={detailGridStyle}>
                      <div style={detailTileStyle}>
                        <div style={labelStyle}>Platform</div>
                        <div style={valueStyle}>
                          {optionalValue(post.platform)}
                        </div>
                      </div>

                      <div style={detailTileStyle}>
                        <div style={labelStyle}>Type</div>
                        <div style={valueStyle}>
                          {optionalValue(post.post_type)}
                        </div>
                      </div>

                      <div style={detailTileStyle}>
                        <div style={labelStyle}>Post Date</div>
                        <div style={valueStyle}>{formatDate(post.post_date)}</div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(90px, 1fr))",
                        gap: "10px",
                        marginTop: "12px",
                      }}
                    >
                      <div style={detailTileStyle}>
                        <div style={labelStyle}>Comments</div>
                        <div style={valueStyle}>{post.comment_count ?? 0}</div>
                      </div>

                      <div style={detailTileStyle}>
                        <div style={labelStyle}>Reactions</div>
                        <div style={valueStyle}>{post.reaction_count ?? 0}</div>
                      </div>

                      <div style={detailTileStyle}>
                        <div style={labelStyle}>Shares</div>
                        <div style={valueStyle}>{post.share_count ?? 0}</div>
                      </div>
                    </div>

                    {post.pain_points_found && (
                      <p
                        style={{
                          margin: "14px 0 0",
                          color: "#cbd5e1",
                          lineHeight: 1.55,
                        }}
                      >
                        <strong>Pain Points:</strong>{" "}
                        {previewText(post.pain_points_found)}
                      </p>
                    )}

                    {post.leads_found && (
                      <p
                        style={{
                          margin: "10px 0 0",
                          color: "#cbd5e1",
                          lineHeight: 1.55,
                        }}
                      >
                        <strong>Leads:</strong> {previewText(post.leads_found)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}