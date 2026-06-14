"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type Community = {
  id: string;
  name: string;
  platform: string | null;
  status: string | null;
  industry: string | null;
  location_focus: string | null;
  created_at: string | null;
};

type Post = {
  id: string;
  title: string;
  platform: string | null;
  post_type: string | null;
  post_date: string | null;
  follow_up_needed: boolean | null;
  community_id: string | null;
  created_at: string | null;
};

type Attachment = {
  id: string;
  file_name: string;
  file_type: string | null;
  related_post_id: string | null;
  created_at: string | null;
};

type DeleteType = "community" | "post" | "attachment";
type SelectedMap = Record<string, boolean>;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#111",
  color: "white",
  padding: "40px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  padding: "18px",
  borderRadius: "10px",
  backgroundColor: "#1a1a1a",
  marginBottom: "16px",
  maxWidth: "950px",
};

const buttonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "10px 14px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#ffdddd",
};

const checkboxRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: "10px",
  alignItems: "flex-start",
  padding: "12px",
  borderTop: "1px solid #333",
};

function recordKey(type: DeleteType, id: string) {
  return `${type}:${id}`;
}

function countSelected(selected: SelectedMap) {
  return Object.values(selected).filter(Boolean).length;
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function DeleteCommunityPage() {
  const params = useParams<{ id: string }>();
  const communityId = params.id;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});

  const allKeys = useMemo(() => {
    const keys: string[] = [];

    if (community) keys.push(recordKey("community", community.id));
    posts.forEach((row) => keys.push(recordKey("post", row.id)));
    attachments.forEach((row) => keys.push(recordKey("attachment", row.id)));

    return keys;
  }, [community, posts, attachments]);

  const selectedCount = countSelected(selected);

  useEffect(() => {
    async function loadDeleteReview() {
      setLoading(true);
      setErrorMessage("");

      const { data: communityRow, error: communityError } = await supabase
        .from("communities")
        .select("id, name, platform, status, industry, location_focus, created_at")
        .eq("id", communityId)
        .single();

      if (communityError) {
        setErrorMessage(communityError.message);
        setLoading(false);
        return;
      }

      const postResult = await supabase
        .from("posts")
        .select("id, title, platform, post_type, post_date, follow_up_needed, community_id, created_at")
        .eq("community_id", communityId)
        .order("created_at", { ascending: false });

      if (postResult.error) {
        setErrorMessage(postResult.error.message);
        setLoading(false);
        return;
      }

      const loadedPosts = (postResult.data ?? []) as Post[];
      const postIds = loadedPosts.map((post) => post.id);

      let loadedAttachments: Attachment[] = [];

      if (postIds.length > 0) {
        const attachmentResult = await supabase
          .from("attachments")
          .select("id, file_name, file_type, related_post_id, created_at")
          .in("related_post_id", postIds)
          .order("created_at", { ascending: false });

        if (attachmentResult.error) {
          setErrorMessage(attachmentResult.error.message);
          setLoading(false);
          return;
        }

        loadedAttachments = (attachmentResult.data ?? []) as Attachment[];
      }

      const loadedCommunity = communityRow as Community;

      setCommunity(loadedCommunity);
      setPosts(loadedPosts);
      setAttachments(loadedAttachments);
      setSelected({
        [recordKey("community", loadedCommunity.id)]: true,
      });

      setLoading(false);
    }

    loadDeleteReview();
  }, [communityId]);

  function isChecked(type: DeleteType, id: string) {
    return Boolean(selected[recordKey(type, id)]);
  }

  function toggleSelected(type: DeleteType, id: string) {
    const key = recordKey(type, id);

    setSelected((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function selectAll() {
    const next: SelectedMap = {};
    allKeys.forEach((key) => {
      next[key] = true;
    });
    setSelected(next);
  }

  function unselectAll() {
    setSelected({});
  }

  function idsFor<T extends { id: string }>(type: DeleteType, rows: T[]) {
    return rows.filter((row) => isChecked(type, row.id)).map((row) => row.id);
  }

  async function deleteIds(table: string, ids: string[]) {
    if (ids.length === 0) return;

    const { error } = await supabase.from(table).delete().in("id", ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function detachIds(table: string, column: string, ids: string[]) {
    if (ids.length === 0) return;

    const { error } = await supabase
      .from(table)
      .update({ [column]: null })
      .in("id", ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function handleDeleteSelected() {
    if (!community || selectedCount === 0) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const communitySelected = isChecked("community", community.id);
      const selectedPostIds = idsFor("post", posts);
      const selectedAttachmentIds = idsFor("attachment", attachments);

      await deleteIds("attachments", selectedAttachmentIds);

      if (selectedPostIds.length > 0) {
        const attachmentsToDetachFromDeletedPosts = attachments
          .filter((attachment) => {
            if (!attachment.related_post_id) return false;
            if (selectedAttachmentIds.includes(attachment.id)) return false;
            return selectedPostIds.includes(attachment.related_post_id);
          })
          .map((attachment) => attachment.id);

        await detachIds("attachments", "related_post_id", attachmentsToDetachFromDeletedPosts);
        await deleteIds("posts", selectedPostIds);
      }

      if (communitySelected) {
        const remainingPostIds = posts
          .filter((post) => !selectedPostIds.includes(post.id))
          .map((post) => post.id);

        await detachIds("posts", "community_id", remainingPostIds);
        await deleteIds("communities", [community.id]);
      }

      setSuccessMessage(
        `Delete complete. Deleted or safely unlinked ${selectedCount} selected item(s).`
      );
      setConfirming(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delete error";
      setErrorMessage(message);
    } finally {
      setDeleting(false);
    }
  }

  function renderCheckbox(
    type: DeleteType,
    id: string,
    title: string,
    details: string
  ) {
    return (
      <label key={recordKey(type, id)} style={checkboxRowStyle}>
        <input
          type="checkbox"
          checked={isChecked(type, id)}
          onChange={() => toggleSelected(type, id)}
          style={{ width: "18px", height: "18px", marginTop: "2px" }}
        />
        <span>
          <strong>{title}</strong>
          <br />
          <span style={{ color: "#aaa" }}>{details}</span>
        </span>
      </label>
    );
  }

  function postTitleForAttachment(attachment: Attachment) {
    const post = posts.find((row) => row.id === attachment.related_post_id);
    return post?.title || "Unknown post";
  }

  return (
    <main style={pageStyle}>
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        <Link href="/communities" style={buttonStyle}>
          Back to Communities
        </Link>

        {community && (
          <Link href={`/communities/${community.id}`} style={buttonStyle}>
            Back to Community
          </Link>
        )}
      </div>

      <h1>Delete Community Review</h1>

      <p style={{ color: "#aaa", maxWidth: "850px", lineHeight: 1.5 }}>
        Review everything connected to this community before deleting. Only checked records
        are deleted. Unchecked related records are preserved. If the community itself is
        deleted, unchecked posts are safely unlinked from the deleted community when possible.
        If selected posts are deleted, unchecked post attachments are safely unlinked.
      </p>

      {loading && <p>Loading delete review...</p>}

      {errorMessage && (
        <p style={{ color: "red", fontWeight: "bold" }}>Error: {errorMessage}</p>
      )}

      {successMessage && (
        <div style={{ ...cardStyle, borderColor: "#2f8f2f" }}>
          <h2 style={{ marginTop: 0 }}>Delete Complete</h2>
          <p style={{ color: "#90ee90" }}>{successMessage}</p>
          <Link href="/communities" style={buttonStyle}>
            Return to Communities
          </Link>
        </div>
      )}

      {!loading && community && !successMessage && (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Selected Community</h2>

            {renderCheckbox(
              "community",
              community.id,
              community.name,
              `Platform: ${community.platform || "None"} | Status: ${
                community.status || "None"
              } | Industry: ${community.industry || "None"}`
            )}
          </div>

          <div
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong>Total selected:</strong> {selectedCount}
              <br />
              <span style={{ color: "#aaa" }}>
                Default selection is community only. Related records start unchecked.
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={selectAll} style={buttonStyle}>
                Select All
              </button>

              <button type="button" onClick={unselectAll} style={buttonStyle}>
                Unselect All
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Related Posts ({posts.length})</h2>

            {posts.length === 0 && <p style={{ color: "#aaa" }}>No related posts.</p>}

            {posts.map((post) =>
              renderCheckbox(
                "post",
                post.id,
                post.title,
                `Platform: ${post.platform || "None"} | Type: ${
                  post.post_type || "None"
                } | Date: ${formatDate(post.post_date || post.created_at)}`
              )
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Attachments Connected To Related Posts ({attachments.length})</h2>

            {attachments.length === 0 && (
              <p style={{ color: "#aaa" }}>No attachments connected to related posts.</p>
            )}

            {attachments.map((attachment) =>
              renderCheckbox(
                "attachment",
                attachment.id,
                attachment.file_name,
                `Post: ${postTitleForAttachment(attachment)} | Type: ${
                  attachment.file_type || "None"
                } | Created: ${formatDate(attachment.created_at)}`
              )
            )}
          </div>

          <div
            style={{
              ...cardStyle,
              borderColor: "#8f2f2f",
              backgroundColor: "#201111",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Final Delete Action</h2>

            <p>
              Selected records: <strong>{selectedCount}</strong>
            </p>

            <p style={{ color: "#ffb3b3" }}>
              This action cannot be undone from inside Sell It yet.
            </p>

            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={selectedCount === 0 || deleting}
              style={dangerButtonStyle}
            >
              Review Final Confirmation
            </button>
          </div>

          {confirming && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.78)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <div
                style={{
                  ...cardStyle,
                  maxWidth: "560px",
                  borderColor: "#ff9999",
                  backgroundColor: "#1a1a1a",
                }}
              >
                <h2 style={{ marginTop: 0 }}>Confirm Delete</h2>

                <p>
                  You are about to delete or unlink <strong>{selectedCount}</strong>{" "}
                  selected item(s) for community <strong>{community.name}</strong>.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    style={dangerButtonStyle}
                  >
                    {deleting ? "Deleting..." : "Yes, Delete Selected Records"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    style={buttonStyle}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
