"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

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
};

type Attachment = {
  id: string;
  file_name: string;
  file_type: string | null;
  related_post_id: string | null;
  created_at: string | null;
};

type DeleteType = "post" | "attachment";
type SelectedMap = Record<string, boolean>;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "1080px",
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
  color: "#fda4af",
  fontSize: "13px",
  fontWeight: 900,
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
  maxWidth: "820px",
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
  padding: "20px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
  marginBottom: "16px",
};

const warningCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(251, 113, 133, 0.42)",
  background:
    "linear-gradient(135deg, rgba(127, 29, 29, 0.42), rgba(15, 23, 42, 0.94))",
};

const successCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(74, 222, 128, 0.35)",
  background:
    "linear-gradient(135deg, rgba(20, 83, 45, 0.35), rgba(15, 23, 42, 0.94))",
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  color: "#e2e8f0",
  backgroundColor: "rgba(15, 23, 42, 0.82)",
  padding: "10px 15px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(148, 163, 184, 0.28)",
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  color: "#fff1f2",
  background: "linear-gradient(135deg, #be123c, #fb7185)",
  border: "1px solid rgba(251, 113, 133, 0.55)",
  boxShadow: "0 18px 36px rgba(190, 18, 60, 0.22)",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const checkboxRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px 1fr",
  gap: "10px",
  alignItems: "flex-start",
  padding: "13px",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)",
};

const labelStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: 800,
};

const mutedTextStyle: CSSProperties = {
  color: "#94a3b8",
};

const errorMessageStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.32)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "12px 14px",
  borderRadius: "16px",
  marginBottom: "18px",
  fontWeight: 800,
};

const countPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "34px",
  minHeight: "28px",
  borderRadius: "999px",
  padding: "4px 10px",
  color: "#fecdd3",
  backgroundColor: "rgba(127, 29, 29, 0.34)",
  border: "1px solid rgba(251, 113, 133, 0.38)",
  fontWeight: 900,
};

const detailGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginTop: "16px",
};

const detailTileStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "16px",
  padding: "14px",
  backgroundColor: "rgba(15, 23, 42, 0.58)",
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

export default function DeletePostPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [post, setPost] = useState<Post | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});

  const allKeys = useMemo(() => {
    const keys: string[] = [];

    if (post) keys.push(recordKey("post", post.id));
    attachments.forEach((row) => keys.push(recordKey("attachment", row.id)));

    return keys;
  }, [post, attachments]);

  const selectedCount = countSelected(selected);

  useEffect(() => {
    async function loadDeleteReview() {
      setLoading(true);
      setErrorMessage("");

      const { data: postRow, error: postError } = await supabase
        .from("posts")
        .select(
          "id, workspace_id, community_id, title, platform, post_type, post_url, post_date, original_post_text, screenshot_url, comment_count, reaction_count, share_count, last_checked_date, ai_summary, pain_points_found, leads_found, follow_up_needed, tags, created_at, updated_at"
        )
        .eq("id", postId)
        .single();

      if (postError) {
        setErrorMessage(postError.message);
        setLoading(false);
        return;
      }

      const attachmentResult = await supabase
        .from("attachments")
        .select("id, file_name, file_type, related_post_id, created_at")
        .eq("related_post_id", postId)
        .order("created_at", { ascending: false });

      if (attachmentResult.error) {
        setErrorMessage(attachmentResult.error.message);
        setLoading(false);
        return;
      }

      const loadedPost = postRow as Post;

      setPost(loadedPost);
      setAttachments((attachmentResult.data ?? []) as Attachment[]);
      setSelected({
        [recordKey("post", loadedPost.id)]: true,
      });

      setLoading(false);
    }

    loadDeleteReview();
  }, [postId]);

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
    if (!post || selectedCount === 0) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const postSelected = isChecked("post", post.id);
      const selectedAttachmentIds = idsFor("attachment", attachments);

      await deleteIds("attachments", selectedAttachmentIds);

      if (postSelected) {
        const remainingAttachmentIds = attachments
          .filter((row) => !selectedAttachmentIds.includes(row.id))
          .map((row) => row.id);

        await detachIds("attachments", "related_post_id", remainingAttachmentIds);
        await deleteIds("posts", [post.id]);
      }

      setSuccessMessage(
        `Delete complete. Deleted or safely unlinked ${selectedCount} selected item(s).`
      );
      setConfirming(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown delete error";
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
          style={{
            width: "18px",
            height: "18px",
            marginTop: "2px",
            accentColor: "#fb7185",
          }}
        />

        <span>
          <strong>{title}</strong>
          <br />
          <span style={mutedTextStyle}>{details}</span>
        </span>
      </label>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Danger Zone / Post</p>
            <h1 style={titleStyle}>Delete Post Review</h1>
            <p style={subtitleStyle}>
              Review everything connected directly to this post before deleting.
              Only checked records are deleted. Unchecked attachments are
              preserved and unlinked if the post itself is deleted.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href="/posts" style={secondaryLinkStyle}>
              Back to Posts
            </Link>

            {post && (
              <Link href={`/posts/${post.id}`} style={secondaryLinkStyle}>
                Back to Post
              </Link>
            )}
          </div>
        </div>

        {loading && (
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Loading</p>
            <h2 style={{ margin: 0 }}>Loading delete review...</h2>
            <p style={subtitleStyle}>
              Pulling the post and related attachments before any delete action
              is available.
            </p>
          </div>
        )}

        {errorMessage && <p style={errorMessageStyle}>Error: {errorMessage}</p>}

        {successMessage && (
          <div style={successCardStyle}>
            <h2 style={{ marginTop: 0 }}>Delete Complete</h2>
            <p style={{ color: "#bbf7d0", lineHeight: 1.55 }}>
              {successMessage}
            </p>
            <Link href="/posts" style={secondaryLinkStyle}>
              Return to Posts
            </Link>
          </div>
        )}

        {!loading && post && !successMessage && (
          <>
            <div style={warningCardStyle}>
              <h2 style={{ marginTop: 0 }}>Selected Post</h2>

              {renderCheckbox(
                "post",
                post.id,
                post.title,
                `Platform: ${post.platform || "None"} | Type: ${
                  post.post_type || "None"
                } | Date: ${formatDate(post.post_date || post.created_at)}`
              )}

              <div style={detailGridStyle}>
                <div style={detailTileStyle}>
                  <div style={labelStyle}>Comments</div>
                  <div>{post.comment_count ?? 0}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Reactions</div>
                  <div>{post.reaction_count ?? 0}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Shares</div>
                  <div>{post.share_count ?? 0}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Follow-up</div>
                  <div>{post.follow_up_needed ? "Needed" : "Not marked"}</div>
                </div>
              </div>

              <p
                style={{
                  color: post.original_post_text ? "#cbd5e1" : "#94a3b8",
                  whiteSpace: "pre-wrap",
                  marginTop: "16px",
                  lineHeight: 1.6,
                }}
              >
                {post.original_post_text || "No original post text saved."}
              </p>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Linked Parent Records</h2>
              <p style={{ ...mutedTextStyle, lineHeight: 1.55 }}>
                These are shown for safety and context. They are not deleted
                from this post delete screen.
              </p>
              <div style={detailTileStyle}>
                <div style={labelStyle}>Community ID</div>
                <div>{post.community_id || "Not linked"}</div>
              </div>
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
                <div style={labelStyle}>Selected Records</div>
                <div style={{ marginTop: "6px" }}>
                  <span style={countPillStyle}>{selectedCount}</span>
                </div>
                <p style={{ ...mutedTextStyle, margin: "10px 0 0" }}>
                  Default selection is post only. Related attachments start
                  unchecked.
                </p>
              </div>

              <div style={actionRowStyle}>
                <button type="button" onClick={selectAll} style={buttonStyle}>
                  Select All
                </button>

                <button type="button" onClick={unselectAll} style={buttonStyle}>
                  Unselect All
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Attachments ({attachments.length})</h2>

              {attachments.length === 0 && (
                <p style={mutedTextStyle}>No related attachments.</p>
              )}

              {attachments.map((attachment) =>
                renderCheckbox(
                  "attachment",
                  attachment.id,
                  attachment.file_name,
                  `Type: ${attachment.file_type || "None"} | Created: ${formatDate(
                    attachment.created_at
                  )}`
                )
              )}
            </div>

            <div style={warningCardStyle}>
              <h2 style={{ marginTop: 0 }}>Final Delete Action</h2>

              <p>
                Selected records: <strong>{selectedCount}</strong>
              </p>

              <p style={{ color: "#fecdd3", lineHeight: 1.55 }}>
                This action cannot be undone from inside Sell It yet. Use the
                final review step to prevent accidental clicks.
              </p>

              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={selectedCount === 0 || deleting}
                style={{
                  ...dangerButtonStyle,
                  ...(selectedCount === 0 || deleting ? disabledButtonStyle : {}),
                }}
              >
                Review Final Confirmation
              </button>
            </div>

            {confirming && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 50,
                  backgroundColor: "rgba(2, 6, 23, 0.82)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    ...warningCardStyle,
                    maxWidth: "600px",
                    width: "100%",
                    marginBottom: 0,
                  }}
                >
                  <p style={eyebrowStyle}>Final Confirmation</p>
                  <h2 style={{ marginTop: 0 }}>Confirm Delete</h2>

                  <p style={{ lineHeight: 1.6 }}>
                    You are about to delete or unlink{" "}
                    <strong>{selectedCount}</strong> selected item(s) for post{" "}
                    <strong>{post.title}</strong>.
                  </p>

                  <p style={{ color: "#fecdd3", lineHeight: 1.6 }}>
                    The community record will not be deleted by this action.
                    Unchecked attachments will be preserved when possible.
                  </p>

                  <div style={actionRowStyle}>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      disabled={deleting}
                      style={{
                        ...dangerButtonStyle,
                        ...(deleting ? disabledButtonStyle : {}),
                      }}
                    >
                      {deleting ? "Deleting..." : "Delete Selected Records"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={deleting}
                      style={{
                        ...buttonStyle,
                        ...(deleting ? disabledButtonStyle : {}),
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}