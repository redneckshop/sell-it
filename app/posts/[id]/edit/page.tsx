"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type Community = {
  id: string;
  name: string;
  platform: string | null;
};

type Post = {
  id: string;
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
  updated_at: string | null;
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

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: "22px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: 800,
};

const helpTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.45,
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "14px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "130px",
  resize: "vertical",
  lineHeight: 1.55,
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "46px",
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  padding: "12px 18px",
  borderRadius: "999px",
  fontWeight: 900,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  cursor: "pointer",
  boxShadow: "0 18px 36px rgba(124, 58, 237, 0.24)",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.65,
  cursor: "not-allowed",
};

const errorMessageStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.32)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "12px 14px",
  borderRadius: "16px",
  margin: "0 0 18px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "20px",
};

const sectionNoteStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: 1.5,
};

const checkboxCardStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "16px",
  padding: "14px",
  backgroundColor: "rgba(15, 23, 42, 0.58)",
  color: "#f8fafc",
  fontWeight: 800,
};

const metaCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "rgba(15, 23, 42, 0.58)",
};

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params.id;

  const [communities, setCommunities] = useState<Community[]>([]);

  const [title, setTitle] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [postType, setPostType] = useState("Question");
  const [postUrl, setPostUrl] = useState("");
  const [postDate, setPostDate] = useState("");
  const [originalPostText, setOriginalPostText] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [commentCount, setCommentCount] = useState("");
  const [reactionCount, setReactionCount] = useState("");
  const [shareCount, setShareCount] = useState("");
  const [lastCheckedDate, setLastCheckedDate] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [painPointsFound, setPainPointsFound] = useState("");
  const [leadsFound, setLeadsFound] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [tags, setTags] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      setErrorMessage("");

      const [communityResult, postResult] = await Promise.all([
        supabase
          .from("communities")
          .select("id, name, platform")
          .order("name", { ascending: true }),

        supabase
          .from("posts")
          .select(
            "id, community_id, title, platform, post_type, post_url, post_date, original_post_text, screenshot_url, comment_count, reaction_count, share_count, last_checked_date, ai_summary, pain_points_found, leads_found, follow_up_needed, tags, updated_at"
          )
          .eq("id", postId)
          .single(),
      ]);

      const firstError = communityResult.error || postResult.error;

      setLoading(false);

      if (firstError) {
        setErrorMessage(firstError.message);
        return;
      }

      setCommunities((communityResult.data ?? []) as Community[]);

      const post = postResult.data as Post;

      setTitle(post.title || "");
      setCommunityId(post.community_id || "");
      setPlatform(post.platform || "Facebook");
      setPostType(post.post_type || "Question");
      setPostUrl(post.post_url || "");
      setPostDate(post.post_date || "");
      setOriginalPostText(post.original_post_text || "");
      setScreenshotUrl(post.screenshot_url || "");
      setCommentCount(
        post.comment_count !== null ? String(post.comment_count) : ""
      );
      setReactionCount(
        post.reaction_count !== null ? String(post.reaction_count) : ""
      );
      setShareCount(post.share_count !== null ? String(post.share_count) : "");
      setLastCheckedDate(post.last_checked_date || "");
      setAiSummary(post.ai_summary || "");
      setPainPointsFound(post.pain_points_found || "");
      setLeadsFound(post.leads_found || "");
      setFollowUpNeeded(Boolean(post.follow_up_needed));
      setTags(post.tags || "");
      setLastUpdated(post.updated_at);
    }

    if (postId) {
      loadPost();
    }
  }, [postId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("posts")
      .update({
        community_id: communityId || null,
        title,
        platform: platform || null,
        post_type: postType || null,
        post_url: postUrl || null,
        post_date: postDate || null,
        original_post_text: originalPostText || null,
        content: originalPostText || title,
        screenshot_url: screenshotUrl || null,
        comment_count: commentCount ? Number(commentCount) : 0,
        reaction_count: reactionCount ? Number(reactionCount) : 0,
        share_count: shareCount ? Number(shareCount) : 0,
        last_checked_date: lastCheckedDate || null,
        ai_summary: aiSummary || null,
        pain_points_found: painPointsFound || null,
        leads_found: leadsFound || null,
        follow_up_needed: followUpNeeded,
        tags: tags || null,
        updated_by: USER_ID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/posts/${postId}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Market Intelligence / Edit Post</p>
            <h1 style={titleStyle}>Edit Post</h1>
            <p style={subtitleStyle}>
              Update the post source, content, engagement numbers, follow-up
              flag, and market intelligence notes.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href={`/posts/${postId}`} style={secondaryLinkStyle}>
              Back to Post
            </Link>
          </div>
        </div>

        {errorMessage && <p style={errorMessageStyle}>Error: {errorMessage}</p>}

        {loading && (
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Loading</p>
            <h2 style={{ margin: 0 }}>Loading post...</h2>
            <p style={subtitleStyle}>
              Pulling the existing post and community list before opening the
              edit form.
            </p>
          </div>
        )}

        {!loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "18px",
            }}
          >
            <form onSubmit={handleSubmit} style={{ ...cardStyle, ...formStyle }}>
              <div>
                <p style={eyebrowStyle}>Post Identity</p>
                <h2 style={sectionTitleStyle}>Where this post came from</h2>
                <p style={sectionNoteStyle}>
                  Keep the source details clean so this post stays useful as
                  market evidence.
                </p>
              </div>

              <label style={labelStyle}>
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Community
                  <select
                    value={communityId}
                    onChange={(event) => setCommunityId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">No community selected</option>
                    {communities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                        {community.platform ? ` — ${community.platform}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={labelStyle}>
                  Platform
                  <select
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Reddit">Reddit</option>
                    <option value="Forum">Forum</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Website">Website</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Post Type
                  <select
                    value={postType}
                    onChange={(event) => setPostType(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="Question">Question</option>
                    <option value="Problem Research">Problem Research</option>
                    <option value="Product Mention">Product Mention</option>
                    <option value="Lead Magnet">Lead Magnet</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Comment Reply">Comment Reply</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Post URL
                  <input
                    value={postUrl}
                    onChange={(event) => setPostUrl(event.target.value)}
                    placeholder="https://facebook.com/..."
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Screenshot URL
                  <input
                    value={screenshotUrl}
                    onChange={(event) => setScreenshotUrl(event.target.value)}
                    placeholder="Optional screenshot URL"
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Post Date
                  <input
                    type="date"
                    value={postDate}
                    onChange={(event) => setPostDate(event.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Last Checked Date
                  <input
                    type="date"
                    value={lastCheckedDate}
                    onChange={(event) => setLastCheckedDate(event.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>

              <div>
                <p style={eyebrowStyle}>Post Content</p>
                <h2 style={sectionTitleStyle}>What the post said</h2>
                <p style={sectionNoteStyle}>
                  Preserve the original wording so future AI review can use the
                  same source material.
                </p>
              </div>

              <label style={labelStyle}>
                Original Post Text
                <textarea
                  value={originalPostText}
                  onChange={(event) => setOriginalPostText(event.target.value)}
                  rows={6}
                  style={textareaStyle}
                />
                <span style={helpTextStyle}>
                  If this is blank, Sell It will use the title as fallback
                  content.
                </span>
              </label>

              <div>
                <p style={eyebrowStyle}>Engagement</p>
                <h2 style={sectionTitleStyle}>Counts and follow-up</h2>
                <p style={sectionNoteStyle}>
                  Update these when you re-check the post or notice new
                  comments.
                </p>
              </div>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Comment Count
                  <input
                    type="number"
                    min="0"
                    value={commentCount}
                    onChange={(event) => setCommentCount(event.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Reaction Count
                  <input
                    type="number"
                    min="0"
                    value={reactionCount}
                    onChange={(event) => setReactionCount(event.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Share Count
                  <input
                    type="number"
                    min="0"
                    value={shareCount}
                    onChange={(event) => setShareCount(event.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={checkboxCardStyle}>
                <input
                  type="checkbox"
                  checked={followUpNeeded}
                  onChange={(event) => setFollowUpNeeded(event.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#a855f7",
                  }}
                />
                Follow-up needed
              </label>

              <div>
                <p style={eyebrowStyle}>Market Intelligence</p>
                <h2 style={sectionTitleStyle}>AI and manual notes</h2>
                <p style={sectionNoteStyle}>
                  These fields help Sell It understand what pain points and
                  leads came from the post.
                </p>
              </div>

              <label style={labelStyle}>
                AI Summary
                <textarea
                  value={aiSummary}
                  onChange={(event) => setAiSummary(event.target.value)}
                  rows={4}
                  style={textareaStyle}
                />
              </label>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Pain Points Found
                  <textarea
                    value={painPointsFound}
                    onChange={(event) => setPainPointsFound(event.target.value)}
                    rows={4}
                    style={textareaStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Leads Found
                  <textarea
                    value={leadsFound}
                    onChange={(event) => setLeadsFound(event.target.value)}
                    rows={4}
                    style={textareaStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                Tags
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <div style={metaCardStyle}>
                <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
                  Last Updated
                </h2>
                <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
                  {formatDateTime(lastUpdated)}
                </p>
              </div>

              <div style={actionRowStyle}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...primaryButtonStyle,
                    ...(saving ? disabledButtonStyle : {}),
                  }}
                >
                  {saving ? "Saving..." : "Save Post"}
                </button>

                <Link href={`/posts/${postId}`} style={secondaryLinkStyle}>
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}