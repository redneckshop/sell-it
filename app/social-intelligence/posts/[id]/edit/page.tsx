"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { getCurrentActingUserSnapshot, getDatabaseSafeUserId } from "../../../../lib/actingUser";
import { createWorkLogEntry } from "../../../../lib/workLog";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";

type OptionRow = {
  id: string;
  name?: string | null;
  title?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

const platforms = ["Facebook", "LinkedIn", "Instagram", "X / Twitter", "Other"];
const statuses = ["Draft", "Posted", "Monitoring", "Closed"];

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "960px",
  margin: "0 auto",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "22px",
  padding: "18px",
  background:
    "linear-gradient(180deg, rgba(30, 41, 59, 0.86), rgba(15, 23, 42, 0.92))",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  color: "#dbeafe",
  fontWeight: 850,
  fontSize: "13px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: "13px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  backgroundColor: "rgba(15, 23, 42, 0.94)",
  color: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const buttonStyle: CSSProperties = {
  border: "1px solid rgba(167, 139, 250, 0.55)",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
  color: "white",
  fontWeight: 950,
  padding: "12px 16px",
  cursor: "pointer",
  textDecoration: "none",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.8)",
  color: "#f8fafc",
  fontWeight: 900,
  padding: "10px 13px",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
};

const mutedStyle: CSSProperties = {
  color: "#94a3b8",
  lineHeight: 1.5,
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.35)",
  background: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "11px 12px",
  borderRadius: "14px",
};

function contactName(row: OptionRow) {
  return `${row.first_name || ""} ${row.last_name || ""}`.trim();
}

export default function EditSocialPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [communities, setCommunities] = useState<OptionRow[]>([]);
  const [painPoints, setPainPoints] = useState<OptionRow[]>([]);
  const [mediaAssets, setMediaAssets] = useState<OptionRow[]>([]);
  const [companies, setCompanies] = useState<OptionRow[]>([]);
  const [contacts, setContacts] = useState<OptionRow[]>([]);
  const [opportunities, setOpportunities] = useState<OptionRow[]>([]);

  const [platform, setPlatform] = useState("Facebook");
  const [communityId, setCommunityId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [postText, setPostText] = useState("");
  const [painPointId, setPainPointId] = useState("");
  const [painPointText, setPainPointText] = useState("");
  const [goal, setGoal] = useState("");
  const [mediaAssetId, setMediaAssetId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [postedDate, setPostedDate] = useState("");
  const [status, setStatus] = useState("Draft");

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      setErrorMessage("");

      const [
        postResult,
        communityResult,
        painPointResult,
        mediaResult,
        companyResult,
        contactResult,
        opportunityResult,
        linkedCompanyResult,
        linkedContactResult,
        linkedOpportunityResult,
      ] = await Promise.all([
        supabase.from("social_posts").select("*").eq("id", postId).single(),
        supabase.from("communities").select("id, name").order("name", { ascending: true }),
        supabase.from("pain_points").select("id, name").order("created_at", { ascending: false }),
        supabase.from("social_media_assets").select("id, title").order("created_at", { ascending: false }),
        supabase.from("companies").select("id, name").order("name", { ascending: true }).limit(300),
        supabase.from("contacts").select("id, first_name, last_name").order("first_name", { ascending: true }).limit(300),
        supabase.from("opportunities").select("id, name").order("updated_at", { ascending: false }).limit(300),
        supabase.from("social_post_companies").select("company_id").eq("social_post_id", postId).limit(1),
        supabase.from("social_post_contacts").select("contact_id").eq("social_post_id", postId).limit(1),
        supabase.from("social_post_opportunities").select("opportunity_id").eq("social_post_id", postId).limit(1),
      ]);

      const firstError =
        postResult.error ||
        communityResult.error ||
        painPointResult.error ||
        mediaResult.error ||
        companyResult.error ||
        contactResult.error ||
        opportunityResult.error;

      setLoading(false);

      if (firstError || !postResult.data) {
        setErrorMessage(firstError?.message || "Social post not found.");
        return;
      }

      const post = postResult.data as Record<string, string | null>;

      setPlatform(post.platform || "Facebook");
      setCommunityId(post.community_id || "");
      setGroupName(post.group_name || "");
      setPostTitle(post.post_title || "");
      setPostUrl(post.post_url || "");
      setPostText(post.post_text || "");
      setPainPointId(post.pain_point_id || "");
      setPainPointText(post.pain_point_text || "");
      setGoal(post.goal || "");
      setMediaAssetId(post.media_asset_id || "");
      setPostedDate(post.posted_date || "");
      setStatus(post.status || "Draft");

      setCommunities((communityResult.data ?? []) as OptionRow[]);
      setPainPoints((painPointResult.data ?? []) as OptionRow[]);
      setMediaAssets((mediaResult.data ?? []) as OptionRow[]);
      setCompanies((companyResult.data ?? []) as OptionRow[]);
      setContacts((contactResult.data ?? []) as OptionRow[]);
      setOpportunities((opportunityResult.data ?? []) as OptionRow[]);

      setCompanyId(String(linkedCompanyResult.data?.[0]?.company_id || ""));
      setContactId(String(linkedContactResult.data?.[0]?.contact_id || ""));
      setOpportunityId(String(linkedOpportunityResult.data?.[0]?.opportunity_id || ""));
    }

    loadPost();
  }, [postId]);

  async function resetAndInsertRelations() {
    await Promise.all([
      supabase.from("social_post_companies").delete().eq("social_post_id", postId),
      supabase.from("social_post_contacts").delete().eq("social_post_id", postId),
      supabase.from("social_post_opportunities").delete().eq("social_post_id", postId),
      supabase.from("social_post_media_assets").delete().eq("social_post_id", postId),
    ]);

    const inserts = [];

    if (companyId) {
      inserts.push(
        supabase.from("social_post_companies").insert({
          workspace_id: WORKSPACE_ID,
          social_post_id: postId,
          company_id: companyId,
          created_by: getDatabaseSafeUserId(),
        })
      );
    }

    if (contactId) {
      inserts.push(
        supabase.from("social_post_contacts").insert({
          workspace_id: WORKSPACE_ID,
          social_post_id: postId,
          contact_id: contactId,
          created_by: getDatabaseSafeUserId(),
        })
      );
    }

    if (opportunityId) {
      inserts.push(
        supabase.from("social_post_opportunities").insert({
          workspace_id: WORKSPACE_ID,
          social_post_id: postId,
          opportunity_id: opportunityId,
          created_by: getDatabaseSafeUserId(),
        })
      );
    }

    if (mediaAssetId) {
      inserts.push(
        supabase.from("social_post_media_assets").insert({
          workspace_id: WORKSPACE_ID,
          social_post_id: postId,
          media_asset_id: mediaAssetId,
          created_by: getDatabaseSafeUserId(),
        })
      );
    }

    const results = await Promise.all(inserts);
    return results.find((result) => result.error)?.error ?? null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const actingUser = getCurrentActingUserSnapshot();

    const result = await supabase
      .from("social_posts")
      .update({
        platform: platform || null,
        community_id: communityId || null,
        group_name: groupName || null,
        post_title: postTitle,
        post_url: postUrl || null,
        post_text: postText || null,
        pain_point_id: painPointId || null,
        pain_point_text: painPointText || null,
        goal: goal || null,
        media_asset_id: mediaAssetId || null,
        posted_by_profile_id: actingUser.profileId,
        posted_by_team_member_id: actingUser.teamMemberId,
        posted_by_name: actingUser.displayName,
        posted_date: postedDate || null,
        status,
        updated_by: getDatabaseSafeUserId(),
      })
      .eq("id", postId);

    if (result.error) {
      setSaving(false);
      setErrorMessage(result.error.message);
      return;
    }

    const relationError = await resetAndInsertRelations();

    setSaving(false);

    if (relationError) {
      setErrorMessage(relationError.message);
      return;
    }

    await createWorkLogEntry({
      actionType: "updated",
      entityType: "social_post",
      entityId: postId,
      entityLabel: postTitle,
      summary: `Updated tracked social post ${postTitle}.`,
    });

    router.push(`/social-intelligence/posts/${postId}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div>
            <p style={{ margin: "0 0 8px", color: "#c4b5fd", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Social Intelligence / Edit
            </p>
            <h1 style={{ margin: 0 }}>Edit Social Post</h1>
            <p style={mutedStyle}>Update the tracked post and its manual relationships.</p>
          </div>

          <Link href={`/social-intelligence/posts/${postId}`} style={secondaryButtonStyle}>
            Back to Detail
          </Link>
        </div>

        {errorMessage && <p style={errorStyle}>Error: {errorMessage}</p>}

        {loading ? (
          <section style={cardStyle}>
            <h2>Loading...</h2>
          </section>
        ) : (
          <form onSubmit={handleSubmit} style={{ ...cardStyle, display: "grid", gap: "13px" }}>
            <label style={labelStyle}>
              Post Title
              <input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} required style={inputStyle} />
            </label>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Platform
                <select value={platform} onChange={(event) => setPlatform(event.target.value)} style={inputStyle}>
                  {platforms.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>
                  {statuses.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Community
                <select value={communityId} onChange={(event) => setCommunityId(event.target.value)} style={inputStyle}>
                  <option value="">No community selected</option>
                  {communities.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Group / Community Name
                <input value={groupName} onChange={(event) => setGroupName(event.target.value)} style={inputStyle} />
              </label>
            </div>

            <label style={labelStyle}>
              Post URL
              <input value={postUrl} onChange={(event) => setPostUrl(event.target.value)} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Post Text
              <textarea value={postText} onChange={(event) => setPostText(event.target.value)} rows={7} style={{ ...inputStyle, resize: "vertical" }} />
            </label>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Pain Point
                <select value={painPointId} onChange={(event) => setPainPointId(event.target.value)} style={inputStyle}>
                  <option value="">No pain point selected</option>
                  {painPoints.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Pain Point Text
                <input value={painPointText} onChange={(event) => setPainPointText(event.target.value)} style={inputStyle} />
              </label>
            </div>

            <label style={labelStyle}>
              Goal
              <input value={goal} onChange={(event) => setGoal(event.target.value)} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Media Used
              <select value={mediaAssetId} onChange={(event) => setMediaAssetId(event.target.value)} style={inputStyle}>
                <option value="">No media selected</option>
                {mediaAssets.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </label>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Link Company
                <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} style={inputStyle}>
                  <option value="">No company selected</option>
                  {companies.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Link Contact
                <select value={contactId} onChange={(event) => setContactId(event.target.value)} style={inputStyle}>
                  <option value="">No contact selected</option>
                  {contacts.map((item) => (
                    <option key={item.id} value={item.id}>{contactName(item)}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Link Opportunity
                <select value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)} style={inputStyle}>
                  <option value="">No opportunity selected</option>
                  {opportunities.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <label style={labelStyle}>
              Posted Date
              <input type="date" value={postedDate} onChange={(event) => setPostedDate(event.target.value)} style={inputStyle} />
            </label>

            <button type="submit" disabled={saving} style={buttonStyle}>
              {saving ? "Saving..." : "Save Social Post"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
