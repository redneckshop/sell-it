"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

type CompanyResult = {
  id: string;
  name: string;
  lead_temperature: string | null;
};

type ContactResult = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
};

type SocialPostResult = {
  id: string;
  post_title: string;
  platform: string | null;
  status: string | null;
  group_name: string | null;
};

type MediaResult = {
  id: string;
  title: string;
  category: string | null;
  tags: string | null;
};

const sectionStyle: CSSProperties = {
  border: "1px solid rgba(167, 139, 250, 0.42)",
  borderRadius: "26px",
  padding: "24px",
  background:
    "linear-gradient(135deg, rgba(88, 28, 135, 0.26), rgba(30, 41, 59, 0.94), rgba(15, 23, 42, 0.96))",
  marginBottom: "32px",
  boxShadow:
    "0 22px 70px rgba(0, 0, 0, 0.34), 0 0 0 1px rgba(255,255,255,0.03) inset",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  border: "1px solid rgba(196, 181, 253, 0.42)",
  backgroundColor: "rgba(124, 58, 237, 0.22)",
  color: "#ddd6fe",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  marginBottom: "10px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#f8fafc",
  fontSize: "26px",
  letterSpacing: "-0.03em",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5,
  margin: "8px 0 0",
};

const helperStyle: CSSProperties = {
  color: "#a5b4fc",
  lineHeight: 1.45,
  margin: 0,
  maxWidth: "360px",
  fontSize: "14px",
};

const searchBoxStyle: CSSProperties = {
  border: "1px solid rgba(196, 181, 253, 0.32)",
  borderRadius: "20px",
  padding: "14px",
  backgroundColor: "rgba(2, 6, 23, 0.46)",
  boxShadow: "0 16px 32px rgba(0,0,0,0.22)",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "#ede9fe",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "18px 18px",
  borderRadius: "16px",
  border: "1px solid rgba(196, 181, 253, 0.42)",
  fontSize: "18px",
  backgroundColor: "rgba(15, 23, 42, 0.96)",
  color: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
  boxShadow: "0 0 0 4px rgba(124, 58, 237, 0.12)",
};

const resultCardStyle: CSSProperties = {
  display: "block",
  color: "#f8fafc",
  textDecoration: "none",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "15px",
  padding: "13px 15px",
  marginBottom: "10px",
  backgroundColor: "rgba(15, 23, 42, 0.78)",
};

const resultSectionStyle: CSSProperties = {
  marginTop: "20px",
};

const resultHeadingStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "#ddd6fe",
  fontSize: "14px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const errorStyle: CSSProperties = {
  color: "#fecaca",
  border: "1px solid rgba(248, 113, 113, 0.36)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  padding: "12px 14px",
  borderRadius: "14px",
};

function safeSearch(value: string) {
  return value.replace(/[,%]/g, " ").trim();
}

export default function HomeSearch() {
  const [searchText, setSearchText] = useState("");
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [contacts, setContacts] = useState<ContactResult[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPostResult[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function runSearch() {
      const cleanedSearch = safeSearch(searchText);

      if (cleanedSearch.length < 2) {
        setCompanies([]);
        setContacts([]);
        setSocialPosts([]);
        setMediaAssets([]);
        setErrorMessage("");
        return;
      }

      setSearching(true);
      setErrorMessage("");

      const searchParts = cleanedSearch
        .split(" ")
        .map((part) => part.trim())
        .filter(Boolean);

      const companyFilter = `name.ilike.%${cleanedSearch}%`;

      const contactFilters = [
        `first_name.ilike.%${cleanedSearch}%`,
        `last_name.ilike.%${cleanedSearch}%`,
        `email.ilike.%${cleanedSearch}%`,
        ...searchParts.flatMap((part) => [
          `first_name.ilike.%${part}%`,
          `last_name.ilike.%${part}%`,
          `email.ilike.%${part}%`,
        ]),
      ].join(",");

      const socialPostFilters = [
        `post_title.ilike.%${cleanedSearch}%`,
        `post_text.ilike.%${cleanedSearch}%`,
        `group_name.ilike.%${cleanedSearch}%`,
        `pain_point_text.ilike.%${cleanedSearch}%`,
        `goal.ilike.%${cleanedSearch}%`,
      ].join(",");

      const mediaFilters = [
        `title.ilike.%${cleanedSearch}%`,
        `category.ilike.%${cleanedSearch}%`,
        `tags.ilike.%${cleanedSearch}%`,
        `description.ilike.%${cleanedSearch}%`,
      ].join(",");

      const [companyResult, contactResult, socialPostResult, mediaResult] =
        await Promise.all([
          supabase
            .from("companies")
            .select("id, name, lead_temperature")
            .or(companyFilter)
            .order("name", { ascending: true })
            .limit(5),
          supabase
            .from("contacts")
            .select("id, first_name, last_name, email")
            .or(contactFilters)
            .order("first_name", { ascending: true })
            .limit(5),
          supabase
            .from("social_posts")
            .select("id, post_title, platform, status, group_name")
            .or(socialPostFilters)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("social_media_assets")
            .select("id, title, category, tags")
            .or(mediaFilters)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      setSearching(false);

      const firstError =
        companyResult.error ||
        contactResult.error ||
        socialPostResult.error ||
        mediaResult.error;

      if (firstError) {
        setErrorMessage(firstError.message);
        return;
      }

      setCompanies(companyResult.data ?? []);
      setContacts(contactResult.data ?? []);
      setSocialPosts((socialPostResult.data ?? []) as SocialPostResult[]);
      setMediaAssets((mediaResult.data ?? []) as MediaResult[]);
    }

    const timeoutId = window.setTimeout(runSearch, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchText]);

  const hasResults =
    companies.length > 0 ||
    contacts.length > 0 ||
    socialPosts.length > 0 ||
    mediaAssets.length > 0;

  return (
    <section style={sectionStyle}>
      <div style={headerRowStyle}>
        <div>
          <span style={badgeStyle}>Global Search</span>
          <h2 style={titleStyle}>Search Sell It Records</h2>
          <p style={mutedTextStyle}>
            Find companies, contacts, social posts, and marketing media from one place.
          </p>
        </div>

        <p style={helperStyle}>
          This is the record search box. The Assistant question box above sends a question to AI.
        </p>
      </div>

      <div style={searchBoxStyle}>
        <label style={labelStyle}>Type here to search records</label>
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Example: SOCIAL TEST, Need trucks, Belly Dump Mafia, company name..."
          style={inputStyle}
        />
      </div>

      {searching && <p style={mutedTextStyle}>Searching...</p>}

      {errorMessage && <p style={errorStyle}>Error: {errorMessage}</p>}

      {searchText.trim().length >= 2 && !searching && !hasResults && (
        <p style={mutedTextStyle}>No records found.</p>
      )}

      {companies.length > 0 && (
        <div style={resultSectionStyle}>
          <h3 style={resultHeadingStyle}>Companies</h3>

          {companies.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`} style={resultCardStyle}>
              <strong>{company.name}</strong>

              {company.lead_temperature && (
                <span style={{ color: "#94a3b8" }}> — {company.lead_temperature} Lead</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {contacts.length > 0 && (
        <div style={resultSectionStyle}>
          <h3 style={resultHeadingStyle}>Contacts</h3>

          {contacts.map((contact) => (
            <Link key={contact.id} href={`/contacts/${contact.id}`} style={resultCardStyle}>
              <strong>{contact.first_name} {contact.last_name || ""}</strong>

              {contact.email && (
                <span style={{ color: "#94a3b8" }}> — {contact.email}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {socialPosts.length > 0 && (
        <div style={resultSectionStyle}>
          <h3 style={resultHeadingStyle}>Social Posts</h3>

          {socialPosts.map((post) => (
            <Link key={post.id} href={`/social-intelligence/posts/${post.id}`} style={resultCardStyle}>
              <strong>{post.post_title}</strong>
              <span style={{ color: "#94a3b8" }}>
                {" "}— {post.platform || "No platform"} | {post.status || "No status"} | {post.group_name || "No group"}
              </span>
            </Link>
          ))}
        </div>
      )}

      {mediaAssets.length > 0 && (
        <div style={resultSectionStyle}>
          <h3 style={resultHeadingStyle}>Media Assets</h3>

          {mediaAssets.map((asset) => (
            <Link key={asset.id} href={`/social-intelligence/media/${asset.id}`} style={resultCardStyle}>
              <strong>{asset.title}</strong>
              <span style={{ color: "#94a3b8" }}>
                {" "}— {asset.category || "No category"} {asset.tags ? `| ${asset.tags}` : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
