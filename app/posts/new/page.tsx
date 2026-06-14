"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type Community = {
  id: string;
  name: string;
  platform: string | null;
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

export default function NewPostPage() {
  const router = useRouter();

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

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCommunities() {
      const { data } = await supabase
        .from("communities")
        .select("id, name, platform")
        .order("name", { ascending: true });

      setCommunities((data ?? []) as Community[]);
    }

    loadCommunities();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("posts")
      .insert({
        workspace_id: WORKSPACE_ID,
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
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/posts/${data.id}`);
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

      <h1>Add Post</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Add a post made inside a community. This gives Sell It a structure for
        tracking market research, leads, pain points, comments, and screenshots
        later.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "800px",
        }}
      >
        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Example: What is your biggest challenge with trucking paperwork?"
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
            rows={5}
            placeholder="Paste the original post text here."
            style={inputStyle}
          />
        </label>

        <label>
          Screenshot URL
          <input
            value={screenshotUrl}
            onChange={(event) => setScreenshotUrl(event.target.value)}
            placeholder="Optional screenshot URL for now"
            style={inputStyle}
          />
        </label>

        <label>
          Comment Count
          <input
            type="number"
            value={commentCount}
            onChange={(event) => setCommentCount(event.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </label>

        <label>
          Reaction Count
          <input
            type="number"
            value={reactionCount}
            onChange={(event) => setReactionCount(event.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </label>

        <label>
          Share Count
          <input
            type="number"
            value={shareCount}
            onChange={(event) => setShareCount(event.target.value)}
            placeholder="0"
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
            placeholder="Leave blank for now. AI will fill this later."
            style={inputStyle}
          />
        </label>

        <label>
          Pain Points Found
          <textarea
            value={painPointsFound}
            onChange={(event) => setPainPointsFound(event.target.value)}
            rows={4}
            placeholder="Example: Drivers hate paperwork, tickets get lost, brokers ask for photos."
            style={inputStyle}
          />
        </label>

        <label>
          Leads Found
          <textarea
            value={leadsFound}
            onChange={(event) => setLeadsFound(event.target.value)}
            rows={4}
            placeholder="Example: John Smith - owner operator - asked about digital tickets."
            style={inputStyle}
          />
        </label>

        <label>
          Tags
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Example: trucking paperwork, tickets, dispatch"
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

        {errorMessage && (
          <p style={{ color: "red" }}>Error: {errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "12px 18px",
            borderRadius: "6px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
            maxWidth: "220px",
          }}
        >
          {saving ? "Saving..." : "Save Post"}
        </button>
      </form>
    </main>
  );
}