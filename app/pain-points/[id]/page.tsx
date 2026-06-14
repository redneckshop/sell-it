"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

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

const buttonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "10px 14px",
  borderRadius: "6px",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

const linkButtonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "10px 14px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  padding: "18px",
  borderRadius: "10px",
  backgroundColor: "#1a1a1a",
  color: "white",
  textDecoration: "none",
  marginBottom: "12px",
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
    loadEverything();
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
      created_by: USER_ID,
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
      created_by: USER_ID,
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
      created_by: USER_ID,
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
      created_by: USER_ID,
    });

    if (error) {
      setMessage(`Post link failed: ${error.message}`);
      return;
    }

    setPostId("");
    setMessage("Post linked.");
    await loadEverything();
  }

  if (loading) {
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
        <p>Loading pain point...</p>
      </main>
    );
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
        <Link href="/" style={linkButtonStyle}>
          Home
        </Link>

        <Link href="/pain-points" style={linkButtonStyle}>
          Back to Pain Points
        </Link>

        <Link href="/pain-points/new" style={linkButtonStyle}>
          Add Pain Point
        </Link>
      </div>

      {message && (
        <p
          style={{
            color:
              message.includes("failed") || message.includes("Could not")
                ? "red"
                : "#ffcc66",
          }}
        >
          {message}
        </p>
      )}

      {!painPoint && <p style={{ color: "#aaa" }}>Pain point not found.</p>}

      {painPoint && (
        <>
          <h1>{painPoint.name}</h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "850px",
              marginBottom: "40px",
            }}
          >
            <p>
              <strong>Category:</strong> {painPoint.category || "Not provided"}
            </p>

            <p>
              <strong>Description:</strong>
            </p>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {painPoint.description || "No description saved yet."}
            </p>

            <p>
              <strong>Created:</strong> {formatDateTime(painPoint.created_at)}
            </p>

            <p>
              <strong>Last Updated:</strong>{" "}
              {formatDateTime(painPoint.updated_at)}
            </p>
          </div>

          <section style={{ maxWidth: "900px" }}>
            <h2>Linked Companies</h2>

            <form onSubmit={linkCompany} style={{ marginBottom: "18px" }}>
              <select
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                style={inputStyle}
              >
                <option value="">Choose a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>

              <button type="submit" style={{ ...buttonStyle, marginTop: "10px" }}>
                Link Company
              </button>
            </form>

            {linkedCompanies.length === 0 && (
              <p style={{ color: "#aaa" }}>No companies linked yet.</p>
            )}

            {linkedCompanies.map((linkedCompany) => {
              const company = singleRelation(linkedCompany.companies);

              return company ? (
                <Link
                  key={linkedCompany.id}
                  href={`/companies/${linkedCompany.company_id}`}
                  style={{ ...cardStyle, display: "block" }}
                >
                  <strong>{company.name}</strong>
                </Link>
              ) : null;
            })}

            <h2 style={{ marginTop: "40px" }}>Linked Contacts</h2>

            <form onSubmit={linkContact} style={{ marginBottom: "18px" }}>
              <select
                value={contactId}
                onChange={(event) => setContactId(event.target.value)}
                style={inputStyle}
              >
                <option value="">Choose a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name || ""}
                  </option>
                ))}
              </select>

              <button type="submit" style={{ ...buttonStyle, marginTop: "10px" }}>
                Link Contact
              </button>
            </form>

            {linkedContacts.length === 0 && (
              <p style={{ color: "#aaa" }}>No contacts linked yet.</p>
            )}

            {linkedContacts.map((linkedContact) => {
              const contact = singleRelation(linkedContact.contacts);

              return contact ? (
                <Link
                  key={linkedContact.id}
                  href={`/contacts/${linkedContact.contact_id}`}
                  style={{ ...cardStyle, display: "block" }}
                >
                  <strong>
                    {contact.first_name} {contact.last_name || ""}
                  </strong>
                </Link>
              ) : null;
            })}

            <h2 style={{ marginTop: "40px" }}>Linked Activities</h2>

            <form onSubmit={linkActivity} style={{ marginBottom: "18px" }}>
              <select
                value={activityId}
                onChange={(event) => setActivityId(event.target.value)}
                style={inputStyle}
              >
                <option value="">Choose an activity</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.subject}
                  </option>
                ))}
              </select>

              <button type="submit" style={{ ...buttonStyle, marginTop: "10px" }}>
                Link Activity
              </button>
            </form>

            {linkedActivities.length === 0 && (
              <p style={{ color: "#aaa" }}>No activities linked yet.</p>
            )}

            {linkedActivities.map((linkedActivity) => {
              const activity = singleRelation(linkedActivity.activities);

              return activity ? (
                <Link
                  key={linkedActivity.id}
                  href={`/activities/${linkedActivity.activity_id}`}
                  style={{ ...cardStyle, display: "block" }}
                >
                  <strong>{activity.subject}</strong>
                  <br />
                  <span style={{ color: "#aaa" }}>
                    {activity.activity_date || "No date"}
                  </span>
                </Link>
              ) : null;
            })}

            <h2 style={{ marginTop: "40px" }}>Linked Posts</h2>

            <form onSubmit={linkPost} style={{ marginBottom: "18px" }}>
              <select
                value={postId}
                onChange={(event) => setPostId(event.target.value)}
                style={inputStyle}
              >
                <option value="">Choose a post</option>
                {posts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>

              <button type="submit" style={{ ...buttonStyle, marginTop: "10px" }}>
                Link Post
              </button>
            </form>

            {linkedPosts.length === 0 && (
              <p style={{ color: "#aaa" }}>No posts linked yet.</p>
            )}

            {linkedPosts.map((linkedPost) => {
              const post = singleRelation(linkedPost.posts);

              return post ? (
                <Link
                  key={linkedPost.id}
                  href={`/posts/${linkedPost.post_id}`}
                  style={{ ...cardStyle, display: "block" }}
                >
                  <strong>{post.title}</strong>
                </Link>
              ) : null;
            })}
          </section>
        </>
      )}
    </main>
  );
}