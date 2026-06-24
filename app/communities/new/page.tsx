"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getDatabaseSafeUserId } from "../../lib/actingUser";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const FALLBACK_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

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
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
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
  margin: 0,
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

const sideCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "rgba(15, 23, 42, 0.58)",
};

export default function NewCommunityPage() {
  const router = useRouter();

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

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("communities")
      .insert({
        workspace_id: WORKSPACE_ID,
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
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
      })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/communities/${data.id}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Market Intelligence / New Community</p>
            <h1 style={titleStyle}>Add Community</h1>
            <p style={subtitleStyle}>
              Add a group, forum, page, or online community to track for market
              intelligence, lead signals, pain points, and post activity.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href="/communities" style={secondaryLinkStyle}>
              Back to Communities
            </Link>
          </div>
        </div>

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
                Capture the platform, link, industry, geography, and status so
                this source is easy to track later.
              </p>
            </div>

            <label style={labelStyle}>
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Example: Idaho Trucking Network"
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
                placeholder="What is this community about?"
                style={textareaStyle}
              />
            </label>

            <div>
              <p style={eyebrowStyle}>Audience Fit</p>
              <h2 style={sectionTitleStyle}>Who this community reaches</h2>
              <p style={sectionNoteStyle}>
                These fields help rank whether the community is worth watching
                and using for future outreach.
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
                  placeholder="Example: 12000"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Relevance Score
                <input
                  type="number"
                  value={relevanceScore}
                  onChange={(event) => setRelevanceScore(event.target.value)}
                  placeholder="Example: 1-10"
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
                  placeholder="Example: Trucking, construction, aggregate hauling"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Location Focus
                <input
                  value={locationFocus}
                  onChange={(event) => setLocationFocus(event.target.value)}
                  placeholder="Example: Idaho, Eastern Washington, North Dakota"
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
                Keep posting rules, admin notes, and group culture visible so
                future outreach does not look careless.
              </p>
            </div>

            <label style={labelStyle}>
              Rules / Notes
              <textarea
                value={rulesNotes}
                onChange={(event) => setRulesNotes(event.target.value)}
                rows={5}
                placeholder="Posting rules, group culture, admin notes, restrictions, etc."
                style={textareaStyle}
              />
            </label>

            <label style={labelStyle}>
              Tags
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Example: trucking, leads, Idaho, dispatchers"
                style={inputStyle}
              />
              <span style={helpTextStyle}>
                Use comma-separated tags so this source is easy to search later.
              </span>
            </label>

            {errorMessage && (
              <p style={errorMessageStyle}>Error: {errorMessage}</p>
            )}

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

              <Link href="/communities" style={secondaryLinkStyle}>
                Cancel
              </Link>
            </div>
          </form>

          <aside style={cardStyle}>
            <p style={eyebrowStyle}>Tracking Tip</p>

            <div style={sideCardStyle}>
              <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
                Communities are source channels
              </h2>
              <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
                A clean community record makes it easier to track where posts,
                leads, and pain points are coming from. The related posts will
                show up on the community detail page after posts are added.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

