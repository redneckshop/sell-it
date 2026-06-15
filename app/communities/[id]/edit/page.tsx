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
        community.relevance_score !== null ? String(community.relevance_score) : ""
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

    const { error } = await supabase
      .from("communities")
      .update({
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
        updated_by: USER_ID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", communityId);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/communities/${communityId}`);
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
          href={`/communities/${communityId}`}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Community
        </Link>
      </div>

      <h1>Edit Community</h1>

      {loading && <p>Loading community...</p>}

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
            maxWidth: "750px",
            marginTop: "32px",
          }}
        >
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
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
              style={inputStyle}
            />
          </label>

          <label>
            Member Count
            <input
              type="number"
              value={memberCount}
              onChange={(event) => setMemberCount(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Industry
            <input
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Location Focus
            <input
              value={locationFocus}
              onChange={(event) => setLocationFocus(event.target.value)}
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
              style={inputStyle}
            />
          </label>

          <label>
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

          <label>
            Tags
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              style={inputStyle}
            />
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
            {saving ? "Saving..." : "Save Community"}
          </button>
        </form>
      )}
    </main>
  );
}

