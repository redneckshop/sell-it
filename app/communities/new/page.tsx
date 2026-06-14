"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

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

    router.push(`/communities/${data.id}`);
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
          Back to Communities
        </Link>
      </div>

      <h1>Add Community</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Add a group, forum, page, or online community to track for market
        intelligence.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "750px",
        }}
      >
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Example: Idaho Trucking Network"
            style={inputStyle}
          />
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
          URL
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/group"
            style={inputStyle}
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="What is this community about?"
            style={inputStyle}
          />
        </label>

        <label>
          Member Count
          <input
            type="number"
            value={memberCount}
            onChange={(event) => setMemberCount(event.target.value)}
            placeholder="Example: 12000"
            style={inputStyle}
          />
        </label>

        <label>
          Industry
          <input
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            placeholder="Example: Trucking, construction, aggregate hauling"
            style={inputStyle}
          />
        </label>

        <label>
          Location Focus
          <input
            value={locationFocus}
            onChange={(event) => setLocationFocus(event.target.value)}
            placeholder="Example: Idaho, Eastern Washington, North Dakota"
            style={inputStyle}
          />
        </label>

        <label>
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

        <label>
          Joined Date
          <input
            type="date"
            value={joinedDate}
            onChange={(event) => setJoinedDate(event.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Rules / Notes
          <textarea
            value={rulesNotes}
            onChange={(event) => setRulesNotes(event.target.value)}
            rows={5}
            placeholder="Posting rules, group culture, admin notes, restrictions, etc."
            style={inputStyle}
          />
        </label>

        <label>
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

        <label>
          Tags
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Example: trucking, leads, Idaho, dispatchers"
            style={inputStyle}
          />
        </label>

        {errorMessage && <p style={{ color: "red" }}>Error: {errorMessage}</p>}

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
          {saving ? "Saving..." : "Save Community"}
        </button>
      </form>
    </main>
  );
}