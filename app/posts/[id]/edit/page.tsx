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

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  backgroundColor: "white",
  color: "black",
  border: "1px solid #555",
  borderRadius: "6px",
  fontSize: "16px",
  boxSizing: "border-box",
};

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
          href={`/posts/${postId}`}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Post
        </Link>
      </div>

      <h1>Edit Post</h1>

      {loading && <p>Loading post...</p>}

      {errorMessage && (
        <p style={{ color: "red", marginTop: "24px" }}>
          Error: {errorMessage}
        </p>
      )}

      {!loading && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "800px",
            marginTop: "32px",
          }}
        >
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label>
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
                </option>
              ))}
            </select>
          </label>

          <label>
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

          <label>
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

          <label>
            Post URL
            <input
              value={postUrl}
              onChange={(event) => setPostUrl(event.target.value)}
              placeholder="https://facebook.com/..."
              style={inputStyle}
            />
          </label>

          <label>
            Post Date
            <input
              type="date"
              value={postDate}
              onChange={(event) => setPostDate(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Original Post Text
            <textarea
              value={originalPostText}
              onChange={(event) => setOriginalPostText(event.target.value)}
              rows={6}
              style={inputStyle}
            />
          </label>

          <label>
            Screenshot URL
            <input
              value={screenshotUrl}
              onChange={(event) => setScreenshotUrl(event.target.value)}
              placeholder="Optional screenshot URL"
              style={inputStyle}
            />
          </label>

          <label>
            Comment Count
            <input
              type="number"
              value={commentCount}
              onChange={(event) => setCommentCount(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Reaction Count
            <input
              type="number"
              value={reactionCount}
              onChange={(event) => setReactionCount(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Share Count
            <input
              type="number"
              value={shareCount}
              onChange={(event) => setShareCount(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Last Checked Date
            <input
              type="date"
              value={lastCheckedDate}
              onChange={(event) => setLastCheckedDate(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            AI Summary
            <textarea
              value={aiSummary}
              onChange={(event) => setAiSummary(event.target.value)}
              rows={4}
              style={inputStyle}
            />
          </label>

          <label>
            Pain Points Found
            <textarea
              value={painPointsFound}
              onChange={(event) => setPainPointsFound(event.target.value)}
              rows={4}
              style={inputStyle}
            />
          </label>

          <label>
            Leads Found
            <textarea
              value={leadsFound}
              onChange={(event) => setLeadsFound(event.target.value)}
              rows={4}
              style={inputStyle}
            />
          </label>

          <label>
            Tags
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              color: "white",
            }}
          >
            <input
              type="checkbox"
              checked={followUpNeeded}
              onChange={(event) => setFollowUpNeeded(event.target.checked)}
            />
            Follow-up needed
          </label>

          <p style={{ color: "#aaa" }}>
            Last Updated:{" "}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString()
              : "Not available"}
          </p>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px",
              cursor: "pointer",
              fontWeight: "bold",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "white",
              color: "black",
              fontSize: "16px",
            }}
          >
            {saving ? "Saving..." : "Save Post"}
          </button>
        </form>
      )}
    </main>
  );
}

