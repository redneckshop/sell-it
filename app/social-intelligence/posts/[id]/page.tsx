import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Relation<T> = T | T[] | null;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "22px",
  padding: "18px",
  background:
    "linear-gradient(180deg, rgba(30, 41, 59, 0.86), rgba(15, 23, 42, 0.92))",
  marginBottom: "16px",
};

const mutedStyle: CSSProperties = {
  color: "#94a3b8",
  lineHeight: 1.5,
};

const buttonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.8)",
  color: "#f8fafc",
  fontWeight: 900,
  padding: "10px 13px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

function singleRelation<T>(value: Relation<T> | undefined) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function textBlock(value: string | null) {
  if (!value) return <p style={mutedStyle}>None saved.</p>;

  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        color: "#f8fafc",
        fontFamily: "inherit",
        lineHeight: 1.55,
        margin: 0,
      }}
    >
      {value}
    </pre>
  );
}

export default async function SocialPostDetailPage({ params }: PageProps) {
  const { id } = await params;

  const postResult = await supabase
    .from("social_posts")
    .select(
      "*, communities(id, name, platform), pain_points(id, name), social_media_assets(id, title, storage_path, file_name)"
    )
    .eq("id", id)
    .single();

  if (postResult.error || !postResult.data) {
    return (
      <main style={pageStyle}>
        <section style={shellStyle}>
          <p style={eyebrowStyle}>Social Intelligence</p>
          <h1>Social Post Not Found</h1>
          <p style={mutedStyle}>{postResult.error?.message || "No record found."}</p>
          <Link href="/social-intelligence" style={buttonStyle}>
            Back to Social Intelligence
          </Link>
        </section>
      </main>
    );
  }

  const [companyLinks, contactLinks, opportunityLinks, mediaLinks] =
    await Promise.all([
      supabase
        .from("social_post_companies")
        .select("companies(id, name)")
        .eq("social_post_id", id),
      supabase
        .from("social_post_contacts")
        .select("contacts(id, first_name, last_name)")
        .eq("social_post_id", id),
      supabase
        .from("social_post_opportunities")
        .select("opportunities(id, name)")
        .eq("social_post_id", id),
      supabase
        .from("social_post_media_assets")
        .select("social_media_assets(id, title, file_name)")
        .eq("social_post_id", id),
    ]);

  const post = postResult.data as Record<string, unknown>;
  const community = singleRelation(post.communities as Relation<{ id: string; name: string | null; platform: string | null }>);
  const painPoint = singleRelation(post.pain_points as Relation<{ id: string; name: string | null }>);
  const media = singleRelation(post.social_media_assets as Relation<{ id: string; title: string | null; file_name: string | null }>);

  const companies = (companyLinks.data ?? []) as unknown as Array<{
    companies: Relation<{ id: string; name: string | null }>;
  }>;

  const contacts = (contactLinks.data ?? []) as unknown as Array<{
    contacts: Relation<{ id: string; first_name: string | null; last_name: string | null }>;
  }>;

  const opportunities = (opportunityLinks.data ?? []) as unknown as Array<{
    opportunities: Relation<{ id: string; name: string | null }>;
  }>;

  const relatedMedia = (mediaLinks.data ?? []) as unknown as Array<{
    social_media_assets: Relation<{ id: string; title: string | null; file_name: string | null }>;
  }>;

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div>
            <p style={eyebrowStyle}>Social Intelligence / Social Post</p>
            <h1 style={{ margin: 0 }}>{String(post.post_title || "Untitled Social Post")}</h1>
            <p style={mutedStyle}>
              {String(post.platform || "No platform")} | {String(post.status || "No status")} |{" "}
              {String(post.posted_date || "No posted date")}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/social-intelligence" style={buttonStyle}>
              Back
            </Link>
            <Link href={`/social-intelligence/posts/${id}/edit`} style={buttonStyle}>
              Edit
            </Link>
            {post.post_url ? (
              <a href={String(post.post_url)} target="_blank" rel="noreferrer" style={buttonStyle}>
                Open Published URL
              </a>
            ) : null}
          </div>
        </div>

        <section style={cardStyle}>
          <p style={eyebrowStyle}>Source</p>
          <p style={mutedStyle}>
            Community:{" "}
            {community ? (
              <Link href={`/communities/${community.id}`} style={{ color: "#c4b5fd" }}>
                {community.name || "Community"}
              </Link>
            ) : (
              String(post.group_name || "No community linked")
            )}
          </p>
          <p style={mutedStyle}>Group / Community Name: {String(post.group_name || "None saved")}</p>
          <p style={mutedStyle}>Posted By: {String(post.posted_by_name || "None saved")}</p>
          <p style={mutedStyle}>Post URL: {String(post.post_url || "None saved")}</p>
        </section>

        <section style={cardStyle}>
          <p style={eyebrowStyle}>Post Text</p>
          {textBlock(String(post.post_text || ""))}
        </section>

        <section style={cardStyle}>
          <p style={eyebrowStyle}>Business Intent</p>
          <p style={mutedStyle}>
            Pain Point:{" "}
            {painPoint ? (
              <Link href={`/pain-points/${painPoint.id}`} style={{ color: "#c4b5fd" }}>
                {painPoint.name || "Pain Point"}
              </Link>
            ) : (
              String(post.pain_point_text || "None saved")
            )}
          </p>
          <p style={mutedStyle}>Goal: {String(post.goal || "None saved")}</p>
          <p style={mutedStyle}>
            Primary Media:{" "}
            {media ? (
              <Link href={`/social-intelligence/media/${media.id}`} style={{ color: "#c4b5fd" }}>
                {media.title || media.file_name || "Media"}
              </Link>
            ) : (
              "None saved"
            )}
          </p>
        </section>

        <section style={cardStyle}>
          <p style={eyebrowStyle}>Manual Relationships</p>

          <h3>Companies</h3>
          {companies.length === 0 && <p style={mutedStyle}>No companies linked.</p>}
          {companies.map((row, index) => {
            const company = singleRelation(row.companies);
            if (!company) return null;
            return (
              <p key={`company-${company.id}-${index}`} style={mutedStyle}>
                <Link href={`/companies/${company.id}`} style={{ color: "#c4b5fd" }}>
                  {company.name || "Company"}
                </Link>
              </p>
            );
          })}

          <h3>Contacts</h3>
          {contacts.length === 0 && <p style={mutedStyle}>No contacts linked.</p>}
          {contacts.map((row, index) => {
            const contact = singleRelation(row.contacts);
            if (!contact) return null;
            return (
              <p key={`contact-${contact.id}-${index}`} style={mutedStyle}>
                <Link href={`/contacts/${contact.id}`} style={{ color: "#c4b5fd" }}>
                  {`${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Contact"}
                </Link>
              </p>
            );
          })}

          <h3>Opportunities</h3>
          {opportunities.length === 0 && <p style={mutedStyle}>No opportunities linked.</p>}
          {opportunities.map((row, index) => {
            const opportunity = singleRelation(row.opportunities);
            if (!opportunity) return null;
            return (
              <p key={`opportunity-${opportunity.id}-${index}`} style={mutedStyle}>
                <Link href={`/opportunities/${opportunity.id}`} style={{ color: "#c4b5fd" }}>
                  {opportunity.name || "Opportunity"}
                </Link>
              </p>
            );
          })}

          <h3>Media Used</h3>
          {relatedMedia.length === 0 && <p style={mutedStyle}>No related media rows.</p>}
          {relatedMedia.map((row, index) => {
            const item = singleRelation(row.social_media_assets);
            if (!item) return null;
            return (
              <p key={`media-${item.id}-${index}`} style={mutedStyle}>
                <Link href={`/social-intelligence/media/${item.id}`} style={{ color: "#c4b5fd" }}>
                  {item.title || item.file_name || "Media"}
                </Link>
              </p>
            );
          })}
        </section>
      </section>
    </main>
  );
}
