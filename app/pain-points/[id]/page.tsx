"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getDatabaseSafeUserId } from "../../lib/actingUser";
import RelationshipSummaryPanel, {
  type RelationshipSummaryItem,
} from "../../components/RelationshipSummaryPanel";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const FALLBACK_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type SupabaseRelation<T> = T | T[] | null;

type PainPoint = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type Company = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type Activity = {
  id: string;
  subject: string;
  activity_date: string | null;
};

type Post = {
  id: string;
  title: string;
};

type LinkedCompany = {
  id: string;
  company_id: string;
  companies: SupabaseRelation<Company>;
};

type LinkedContact = {
  id: string;
  contact_id: string;
  contacts: SupabaseRelation<Contact>;
};

type LinkedActivity = {
  id: string;
  activity_id: string;
  activities: SupabaseRelation<Activity>;
};

type LinkedPost = {
  id: string;
  post_id: string;
  posts: SupabaseRelation<Post>;
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
  maxWidth: "760px",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "center",
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 15px",
  borderRadius: "999px",
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  boxShadow: "0 18px 36px rgba(124, 58, 237, 0.24)",
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

const dangerLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 15px",
  borderRadius: "999px",
  color: "#fecdd3",
  backgroundColor: "rgba(127, 29, 29, 0.34)",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(251, 113, 133, 0.45)",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: "20px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const detailGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
  marginTop: "18px",
};

const detailTileStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "16px",
  padding: "14px",
  backgroundColor: "rgba(15, 23, 42, 0.56)",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: 800,
};

const selectStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "14px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  padding: "10px 15px",
  borderRadius: "999px",
  fontWeight: 800,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  cursor: "pointer",
  boxShadow: "0 18px 36px rgba(124, 58, 237, 0.22)",
};

const formCardStyle: CSSProperties = {
  ...cardStyle,
  marginBottom: "14px",
};

const linkedCardStyle: CSSProperties = {
  display: "block",
  color: "#f8fafc",
  textDecoration: "none",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  padding: "16px",
  borderRadius: "18px",
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  marginBottom: "10px",
};

const sectionStyle: CSSProperties = {
  marginTop: "26px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "12px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
};

const mutedTextStyle: CSSProperties = {
  color: "#94a3b8",
};

const messageStyle: CSSProperties = {
  border: "1px solid rgba(250, 204, 21, 0.28)",
  backgroundColor: "rgba(113, 63, 18, 0.22)",
  color: "#fde68a",
  padding: "12px 14px",
  borderRadius: "16px",
  marginBottom: "18px",
};

const errorMessageStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.32)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "12px 14px",
  borderRadius: "16px",
  marginBottom: "18px",
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function contactName(contact: Contact) {
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function isErrorMessage(message: string) {
  return message.includes("failed") || message.includes("Could not");
}

export default function PainPointDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [painPoint, setPainPoint] = useState<PainPoint | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [linkedCompanies, setLinkedCompanies] = useState<LinkedCompany[]>([]);
  const [linkedContacts, setLinkedContacts] = useState<LinkedContact[]>([]);
  const [linkedActivities, setLinkedActivities] = useState<LinkedActivity[]>([]);
  const [linkedPosts, setLinkedPosts] = useState<LinkedPost[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [postId, setPostId] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadEverything() {
    setLoading(true);
    setMessage("");

    const { data: painPointData, error: painPointError } = await supabase
      .from("pain_points")
      .select(
        "id, workspace_id, name, description, category, created_at, updated_at"
      )
      .eq("id", id)
      .single();

    if (painPointError) {
      setMessage(`Could not load pain point: ${painPointError.message}`);
      setLoading(false);
      return;
    }

    setPainPoint(painPointData as unknown as PainPoint);

    const [
      companiesResult,
      contactsResult,
      activitiesResult,
      postsResult,
      linkedCompaniesResult,
      linkedContactsResult,
      linkedActivitiesResult,
      linkedPostsResult,
    ] = await Promise.all([
      supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true }),

      supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .order("first_name", { ascending: true }),

      supabase
        .from("activities")
        .select("id, subject, activity_date")
        .order("activity_date", { ascending: false }),

      supabase
        .from("posts")
        .select("id, title")
        .order("created_at", { ascending: false }),

      supabase
        .from("pain_point_companies")
        .select("id, company_id, companies(id, name)")
        .eq("pain_point_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("pain_point_contacts")
        .select("id, contact_id, contacts(id, first_name, last_name)")
        .eq("pain_point_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("pain_point_activities")
        .select("id, activity_id, activities(id, subject, activity_date)")
        .eq("pain_point_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("pain_point_posts")
        .select("id, post_id, posts(id, title)")
        .eq("pain_point_id", id)
        .order("created_at", { ascending: false }),
    ]);

    setCompanies((companiesResult.data ?? []) as unknown as Company[]);
    setContacts((contactsResult.data ?? []) as unknown as Contact[]);
    setActivities((activitiesResult.data ?? []) as unknown as Activity[]);
    setPosts((postsResult.data ?? []) as unknown as Post[]);

    setLinkedCompanies(
      (linkedCompaniesResult.data ?? []) as unknown as LinkedCompany[]
    );
    setLinkedContacts(
      (linkedContactsResult.data ?? []) as unknown as LinkedContact[]
    );
    setLinkedActivities(
      (linkedActivitiesResult.data ?? []) as unknown as LinkedActivity[]
    );
    setLinkedPosts((linkedPostsResult.data ?? []) as unknown as LinkedPost[]);

    setLoading(false);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEverything();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function linkCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId) {
      setMessage("Choose a company first.");
      return;
    }

    const { error } = await supabase.from("pain_point_companies").insert({
      workspace_id: WORKSPACE_ID,
      pain_point_id: id,
      company_id: companyId,
      created_by: getDatabaseSafeUserId(),
    });

    if (error) {
      setMessage(`Company link failed: ${error.message}`);
      return;
    }

    setCompanyId("");
    setMessage("Company linked.");
    await loadEverything();
  }

  async function linkContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!contactId) {
      setMessage("Choose a contact first.");
      return;
    }

    const { error } = await supabase.from("pain_point_contacts").insert({
      workspace_id: WORKSPACE_ID,
      pain_point_id: id,
      contact_id: contactId,
      created_by: getDatabaseSafeUserId(),
    });

    if (error) {
      setMessage(`Contact link failed: ${error.message}`);
      return;
    }

    setContactId("");
    setMessage("Contact linked.");
    await loadEverything();
  }

  async function linkActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activityId) {
      setMessage("Choose an activity first.");
      return;
    }

    const { error } = await supabase.from("pain_point_activities").insert({
      workspace_id: WORKSPACE_ID,
      pain_point_id: id,
      activity_id: activityId,
      created_by: getDatabaseSafeUserId(),
    });

    if (error) {
      setMessage(`Activity link failed: ${error.message}`);
      return;
    }

    setActivityId("");
    setMessage("Activity linked.");
    await loadEverything();
  }

  async function linkPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!postId) {
      setMessage("Choose a post first.");
      return;
    }

    const { error } = await supabase.from("pain_point_posts").insert({
      workspace_id: WORKSPACE_ID,
      pain_point_id: id,
      post_id: postId,
      created_by: getDatabaseSafeUserId(),
    });

    if (error) {
      setMessage(`Post link failed: ${error.message}`);
      return;
    }

    setPostId("");
    setMessage("Post linked.");
    await loadEverything();
  }

  const relationshipItems: RelationshipSummaryItem[] = [
    {
      label: "Related Companies",
      count: linkedCompanies.length,
      href: `/pain-points/${id}#linked-companies`,
    },
    {
      label: "Related Contacts",
      count: linkedContacts.length,
      href: `/pain-points/${id}#linked-contacts`,
    },
    {
      label: "Related Activities",
      count: linkedActivities.length,
      href: `/pain-points/${id}#linked-activities`,
    },
    {
      label: "Related Posts",
      count: linkedPosts.length,
      href: `/pain-points/${id}#linked-posts`,
    },
  ];

  if (loading) {
    return (
      <main style={pageStyle}>
        <section style={shellStyle}>
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Business Memory</p>
            <h1 style={titleStyle}>Loading pain point...</h1>
            <p style={subtitleStyle}>
              Pulling the pain point and its related companies, contacts,
              activities, and posts.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Business Memory / Pain Point</p>
            <h1 style={titleStyle}>
              {painPoint ? painPoint.name : "Pain point not found"}
            </h1>
            <p style={subtitleStyle}>
              Track the real-world problem, where it appears, who it affects,
              and the activity history connected to it.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href="/pain-points" style={secondaryLinkStyle}>
              Back to Pain Points
            </Link>

            <Link href="/pain-points/new" style={primaryLinkStyle}>
              Add Pain Point
            </Link>

            {painPoint && (
              <Link
                href={`/pain-points/${painPoint.id}/edit`}
                style={secondaryLinkStyle}
              >
                Edit Pain Point
              </Link>
            )}

            {painPoint && (
              <Link
                href={`/pain-points/${painPoint.id}/delete`}
                style={dangerLinkStyle}
              >
                Delete Pain Point
              </Link>
            )}
          </div>
        </div>

        {message && (
          <p style={isErrorMessage(message) ? errorMessageStyle : messageStyle}>
            {message}
          </p>
        )}

        {!painPoint && (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>No pain point found</h2>
            <p style={mutedTextStyle}>
              This record may have been deleted, archived, or the link may be
              incorrect.
            </p>
          </div>
        )}

        {painPoint && (
          <>
            <div style={{ ...cardStyle, marginBottom: "22px" }}>
              <div style={detailGridStyle}>
                <div style={detailTileStyle}>
                  <div style={labelStyle}>Category</div>
                  <div>{painPoint.category || "Not provided"}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Created</div>
                  <div>{formatDateTime(painPoint.created_at)}</div>
                </div>

                <div style={detailTileStyle}>
                  <div style={labelStyle}>Last Updated</div>
                  <div>{formatDateTime(painPoint.updated_at)}</div>
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
                <div style={labelStyle}>Description</div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    color: painPoint.description ? "#f8fafc" : "#94a3b8",
                    lineHeight: 1.65,
                  }}
                >
                  {painPoint.description || "No description saved yet."}
                </div>
              </div>
            </div>

            <RelationshipSummaryPanel
              title={`${painPoint.name} Relationship Summary`}
              subtitle="Quick business-memory snapshot for this pain point."
              items={relationshipItems}
              maxWidth="1180px"
            />

            <section id="linked-companies" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Linked Companies</h2>
                  <p style={{ ...mutedTextStyle, margin: "6px 0 0" }}>
                    Companies currently connected to this pain point.
                  </p>
                </div>
              </div>

              <form onSubmit={linkCompany} style={formCardStyle}>
                <label style={labelStyle} htmlFor="company-id">
                  Link a company
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <select
                    id="company-id"
                    value={companyId}
                    onChange={(event) => setCompanyId(event.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Choose a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>

                  <button type="submit" style={primaryButtonStyle}>
                    Link Company
                  </button>
                </div>
              </form>

              {linkedCompanies.length === 0 && (
                <p style={mutedTextStyle}>No companies linked yet.</p>
              )}

              {linkedCompanies.map((linkedCompany) => {
                const company = singleRelation(linkedCompany.companies);

                return company ? (
                  <Link
                    key={linkedCompany.id}
                    href={`/companies/${linkedCompany.company_id}`}
                    style={linkedCardStyle}
                  >
                    <strong>{company.name}</strong>
                  </Link>
                ) : null;
              })}
            </section>

            <section id="linked-contacts" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Linked Contacts</h2>
                  <p style={{ ...mutedTextStyle, margin: "6px 0 0" }}>
                    People who mentioned, own, or are affected by this pain
                    point.
                  </p>
                </div>
              </div>

              <form onSubmit={linkContact} style={formCardStyle}>
                <label style={labelStyle} htmlFor="contact-id">
                  Link a contact
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <select
                    id="contact-id"
                    value={contactId}
                    onChange={(event) => setContactId(event.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Choose a contact</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contactName(contact)}
                      </option>
                    ))}
                  </select>

                  <button type="submit" style={primaryButtonStyle}>
                    Link Contact
                  </button>
                </div>
              </form>

              {linkedContacts.length === 0 && (
                <p style={mutedTextStyle}>No contacts linked yet.</p>
              )}

              {linkedContacts.map((linkedContact) => {
                const contact = singleRelation(linkedContact.contacts);

                return contact ? (
                  <Link
                    key={linkedContact.id}
                    href={`/contacts/${linkedContact.contact_id}`}
                    style={linkedCardStyle}
                  >
                    <strong>{contactName(contact)}</strong>
                  </Link>
                ) : null;
              })}
            </section>

            <section id="linked-activities" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Linked Activities</h2>
                  <p style={{ ...mutedTextStyle, margin: "6px 0 0" }}>
                    Calls, notes, emails, meetings, or other activity tied to
                    this issue.
                  </p>
                </div>
              </div>

              <form onSubmit={linkActivity} style={formCardStyle}>
                <label style={labelStyle} htmlFor="activity-id">
                  Link an activity
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <select
                    id="activity-id"
                    value={activityId}
                    onChange={(event) => setActivityId(event.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Choose an activity</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.subject}
                      </option>
                    ))}
                  </select>

                  <button type="submit" style={primaryButtonStyle}>
                    Link Activity
                  </button>
                </div>
              </form>

              {linkedActivities.length === 0 && (
                <p style={mutedTextStyle}>No activities linked yet.</p>
              )}

              {linkedActivities.map((linkedActivity) => {
                const activity = singleRelation(linkedActivity.activities);

                return activity ? (
                  <Link
                    key={linkedActivity.id}
                    href={`/activities/${linkedActivity.activity_id}`}
                    style={linkedCardStyle}
                  >
                    <strong>{activity.subject}</strong>
                    <br />
                    <span style={mutedTextStyle}>
                      {formatDateTime(activity.activity_date)}
                    </span>
                  </Link>
                ) : null;
              })}
            </section>

            <section id="linked-posts" style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Linked Posts</h2>
                  <p style={{ ...mutedTextStyle, margin: "6px 0 0" }}>
                    Community or social posts connected to this pain point.
                  </p>
                </div>
              </div>

              <form onSubmit={linkPost} style={formCardStyle}>
                <label style={labelStyle} htmlFor="post-id">
                  Link a post
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <select
                    id="post-id"
                    value={postId}
                    onChange={(event) => setPostId(event.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Choose a post</option>
                    {posts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.title}
                      </option>
                    ))}
                  </select>

                  <button type="submit" style={primaryButtonStyle}>
                    Link Post
                  </button>
                </div>
              </form>

              {linkedPosts.length === 0 && (
                <p style={mutedTextStyle}>No posts linked yet.</p>
              )}

              {linkedPosts.map((linkedPost) => {
                const post = singleRelation(linkedPost.posts);

                return post ? (
                  <Link
                    key={linkedPost.id}
                    href={`/posts/${linkedPost.post_id}`}
                    style={linkedCardStyle}
                  >
                    <strong>{post.title}</strong>
                  </Link>
                ) : null;
              })}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

