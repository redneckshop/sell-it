"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { getDatabaseSafeUserId } from "../../../lib/actingUser";
import { updateRecordWithConcurrencyGuard } from "../../../lib/concurrency";

const FALLBACK_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type Community = {
  id: string;
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

export default function EditCommunityPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const communityId = params.id;

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [industry, setIndustry] = useState("");
  const [locationFocus, setLocationFocus] = useState("");
  const [status, setStatus] = useState("Found");
  const [joinedDate, setJoinedDate] = useState("");
  const [rulesNotes, setRulesNotes] = useState("");
  const [relevanceScore, setRelevanceScore] = useState("");
  const [tags, setTags] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCommunity() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("communities")
        .select(
          "id, name, platform, url, description, member_count, industry, location_focus, status, joined_date, rules_notes, relevance_score, tags, updated_at"
        )
        .eq("id", communityId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const community = data as Community;

      setName(community.name || "");
      setPlatform(community.platform || "Facebook");
      setUrl(community.url || "");
      setDescription(community.description || "");
      setMemberCount(
        community.member_count !== null ? String(community.member_count) : ""
      );
      setIndustry(community.industry || "");
      setLocationFocus(community.location_focus || "");
      setStatus(community.status || "Found");
      setJoinedDate(community.joined_date || "");
      setRulesNotes(community.rules_notes || "");
      setRelevanceScore(
        community.relevance_score !== null
          ? String(community.relevance_score)
          : ""
      );
      setTags(community.tags || "");
      setLastUpdated(community.updated_at);
    }

    if (communityId) {
      loadCommunity();
    }
  }, [communityId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const changedAt = new Date().toISOString();

    const updateResult = await updateRecordWithConcurrencyGuard({
      tableName: "communities",
      recordId: communityId,
      loadedUpdatedAt: lastUpdated,
      entityLabel: name || "Community",
      values: {
        name,
        platform,
        url: url || null,
        description: description || null,
        member_count: memberCount ? Number(memberCount) : null,
        industry: industry || null,
        location_focus: locationFocus || null,
        status,
        joined_date: joinedDate || null,
        rules_notes: rulesNotes || null,
        relevance_score: relevanceScore ? Number(relevanceScore) : null,
        tags: tags || null,
        updated_by: getDatabaseSafeUserId(),
        updated_at: changedAt,
      },
    });

    setSaving(false);

    if (!updateResult.ok) {
      setErrorMessage(updateResult.errorMessage);
      return;
    }

    // Community Edit Concurrency Protection V1

    router.push(`/communities/${communityId}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Market Intelligence / Edit Community</p>
            <h1 style={titleStyle}>Edit Community</h1>
            <p style={subtitleStyle}>
              Update the community source, audience fit, status, rules, and
              notes while keeping related posts connected.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href={`/communities/${communityId}`} style={secondaryLinkStyle}>
              Back to Community
            </Link>
          </div>
        </div>

        {errorMessage && <p style={errorMessageStyle}>Error: {errorMessage}</p>}

        {loading && (
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Loading</p>
            <h2 style={{ margin: 0 }}>Loading community...</h2>
            <p style={subtitleStyle}>
              Pulling the existing community before opening the edit form.
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
                <p style={eyebrowStyle}>Community Identity</p>
                <h2 style={sectionTitleStyle}>Where this audience lives</h2>
                <p style={sectionNoteStyle}>
                  Keep the source details clean so posts, leads, and pain points
                  can be traced back to the right place.
                </p>
              </div>

              <label style={labelStyle}>
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <div style={formGridStyle}>
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
                  Status
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="Found">Found</option>
                    <option value="Requested to Join">Requested to Join</option>
                    <option value="Joined">Joined</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Banned / Removed">Banned / Removed</option>
                    <option value="Not Useful">Not Useful</option>
                  </select>
                </label>
              </div>

              <label style={labelStyle}>
                URL
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com/group"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  style={textareaStyle}
                />
              </label>

              <div>
                <p style={eyebrowStyle}>Audience Fit</p>
                <h2 style={sectionTitleStyle}>Who this community reaches</h2>
                <p style={sectionNoteStyle}>
                  Use these fields to judge whether this source is worth
                  watching, posting in, or using for lead research.
                </p>
              </div>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Member Count
                  <input
                    type="number"
                    min="0"
                    value={memberCount}
                    onChange={(event) => setMemberCount(event.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Relevance Score
                  <input
                    type="number"
                    value={relevanceScore}
                    onChange={(event) => setRelevanceScore(event.target.value)}
                    min="1"
                    max="10"
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Industry
                  <input
                    value={industry}
                    onChange={(event) => setIndustry(event.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Location Focus
                  <input
                    value={locationFocus}
                    onChange={(event) => setLocationFocus(event.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                Joined Date
                <input
                  type="date"
                  value={joinedDate}
                  onChange={(event) => setJoinedDate(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <div>
                <p style={eyebrowStyle}>Rules and Notes</p>
                <h2 style={sectionTitleStyle}>How to use this community safely</h2>
                <p style={sectionNoteStyle}>
                  Keep rules, admin notes, and posting restrictions visible for
                  future outreach.
                </p>
              </div>

              <label style={labelStyle}>
                Rules / Notes
                <textarea
                  value={rulesNotes}
                  onChange={(event) => setRulesNotes(event.target.value)}
                  rows={5}
                  style={textareaStyle}
                />
              </label>

              <label style={labelStyle}>
                Tags
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  style={inputStyle}
                />
                <span style={helpTextStyle}>
                  Use comma-separated tags so this source is easy to search
                  later.
                </span>
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
                  {saving ? "Saving..." : "Save Community"}
                </button>

                <Link
                  href={`/communities/${communityId}`}
                  style={secondaryLinkStyle}
                >
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

