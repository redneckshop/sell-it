"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type SupabaseRelation<T> = T | T[] | null;

type PainPoint = {
  id: string;
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

type DeleteType =
  | "pain_point"
  | "company_link"
  | "contact_link"
  | "activity_link"
  | "post_link";

type SelectedMap = Record<string, boolean>;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#111",
  color: "white",
  padding: "40px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  padding: "18px",
  borderRadius: "10px",
  backgroundColor: "#1a1a1a",
  marginBottom: "16px",
  maxWidth: "950px",
};

const buttonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "10px 14px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#ffdddd",
};

const checkboxRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: "10px",
  alignItems: "flex-start",
  padding: "12px",
  borderTop: "1px solid #333",
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

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

export default function DeletePainPointPage() {
  const params = useParams<{ id: string }>();
  const painPointId = params.id;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [painPoint, setPainPoint] = useState<PainPoint | null>(null);
  const [linkedCompanies, setLinkedCompanies] = useState<LinkedCompany[]>([]);
  const [linkedContacts, setLinkedContacts] = useState<LinkedContact[]>([]);
  const [linkedActivities, setLinkedActivities] = useState<LinkedActivity[]>([]);
  const [linkedPosts, setLinkedPosts] = useState<LinkedPost[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});

  const allKeys = useMemo(() => {
    const keys: string[] = [];

    if (painPoint) keys.push(recordKey("pain_point", painPoint.id));
    linkedCompanies.forEach((row) => keys.push(recordKey("company_link", row.id)));
    linkedContacts.forEach((row) => keys.push(recordKey("contact_link", row.id)));
    linkedActivities.forEach((row) => keys.push(recordKey("activity_link", row.id)));
    linkedPosts.forEach((row) => keys.push(recordKey("post_link", row.id)));

    return keys;
  }, [painPoint, linkedCompanies, linkedContacts, linkedActivities, linkedPosts]);

  const selectedCount = countSelected(selected);

  useEffect(() => {
    async function loadDeleteReview() {
      setLoading(true);
      setErrorMessage("");

      const { data: painPointRow, error: painPointError } = await supabase
        .from("pain_points")
        .select("id, name, description, category, created_at, updated_at")
        .eq("id", painPointId)
        .single();

      if (painPointError) {
        setErrorMessage(painPointError.message);
        setLoading(false);
        return;
      }

      const [
        linkedCompaniesResult,
        linkedContactsResult,
        linkedActivitiesResult,
        linkedPostsResult,
      ] = await Promise.all([
        supabase
          .from("pain_point_companies")
          .select("id, company_id, companies(id, name)")
          .eq("pain_point_id", painPointId)
          .order("created_at", { ascending: false }),

        supabase
          .from("pain_point_contacts")
          .select("id, contact_id, contacts(id, first_name, last_name)")
          .eq("pain_point_id", painPointId)
          .order("created_at", { ascending: false }),

        supabase
          .from("pain_point_activities")
          .select("id, activity_id, activities(id, subject, activity_date)")
          .eq("pain_point_id", painPointId)
          .order("created_at", { ascending: false }),

        supabase
          .from("pain_point_posts")
          .select("id, post_id, posts(id, title)")
          .eq("pain_point_id", painPointId)
          .order("created_at", { ascending: false }),
      ]);

      const firstError =
        linkedCompaniesResult.error ||
        linkedContactsResult.error ||
        linkedActivitiesResult.error ||
        linkedPostsResult.error;

      if (firstError) {
        setErrorMessage(firstError.message);
        setLoading(false);
        return;
      }

      const loadedPainPoint = painPointRow as PainPoint;

      setPainPoint(loadedPainPoint);
      setLinkedCompanies((linkedCompaniesResult.data ?? []) as unknown as LinkedCompany[]);
      setLinkedContacts((linkedContactsResult.data ?? []) as unknown as LinkedContact[]);
      setLinkedActivities((linkedActivitiesResult.data ?? []) as unknown as LinkedActivity[]);
      setLinkedPosts((linkedPostsResult.data ?? []) as unknown as LinkedPost[]);
      setSelected({
        [recordKey("pain_point", loadedPainPoint.id)]: true,
      });

      setLoading(false);
    }

    loadDeleteReview();
  }, [painPointId]);

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

  async function handleDeleteSelected() {
    if (!painPoint || selectedCount === 0) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const painPointSelected = isChecked("pain_point", painPoint.id);

      const selectedCompanyLinkIds = idsFor("company_link", linkedCompanies);
      const selectedContactLinkIds = idsFor("contact_link", linkedContacts);
      const selectedActivityLinkIds = idsFor("activity_link", linkedActivities);
      const selectedPostLinkIds = idsFor("post_link", linkedPosts);

      await deleteIds("pain_point_companies", selectedCompanyLinkIds);
      await deleteIds("pain_point_contacts", selectedContactLinkIds);
      await deleteIds("pain_point_activities", selectedActivityLinkIds);
      await deleteIds("pain_point_posts", selectedPostLinkIds);

      if (painPointSelected) {
        const remainingCompanyLinkIds = linkedCompanies
          .filter((row) => !selectedCompanyLinkIds.includes(row.id))
          .map((row) => row.id);

        const remainingContactLinkIds = linkedContacts
          .filter((row) => !selectedContactLinkIds.includes(row.id))
          .map((row) => row.id);

        const remainingActivityLinkIds = linkedActivities
          .filter((row) => !selectedActivityLinkIds.includes(row.id))
          .map((row) => row.id);

        const remainingPostLinkIds = linkedPosts
          .filter((row) => !selectedPostLinkIds.includes(row.id))
          .map((row) => row.id);

        await deleteIds("pain_point_companies", remainingCompanyLinkIds);
        await deleteIds("pain_point_contacts", remainingContactLinkIds);
        await deleteIds("pain_point_activities", remainingActivityLinkIds);
        await deleteIds("pain_point_posts", remainingPostLinkIds);

        await deleteIds("pain_points", [painPoint.id]);
      }

      setSuccessMessage(
        `Delete complete. Deleted selected pain point/link item(s). Related companies, contacts, activities, and posts were preserved.`
      );
      setConfirming(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delete error";
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
          style={{ width: "18px", height: "18px", marginTop: "2px" }}
        />
        <span>
          <strong>{title}</strong>
          <br />
          <span style={{ color: "#aaa" }}>{details}</span>
        </span>
      </label>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        <Link href="/pain-points" style={buttonStyle}>
          Back to Pain Points
        </Link>

        {painPoint && (
          <Link href={`/pain-points/${painPoint.id}`} style={buttonStyle}>
            Back to Pain Point
          </Link>
        )}
      </div>

      <h1>Delete Pain Point Review</h1>

      <p style={{ color: "#aaa", maxWidth: "850px", lineHeight: 1.5 }}>
        Review this pain point and its relationship links before deleting. Only checked
        records are deleted. Linked companies, contacts, activities, and posts are preserved.
        If the pain point itself is deleted, all remaining relationship links are removed
        so no broken links are left behind.
      </p>

      {loading && <p>Loading delete review...</p>}

      {errorMessage && (
        <p style={{ color: "red", fontWeight: "bold" }}>Error: {errorMessage}</p>
      )}

      {successMessage && (
        <div style={{ ...cardStyle, borderColor: "#2f8f2f" }}>
          <h2 style={{ marginTop: 0 }}>Delete Complete</h2>
          <p style={{ color: "#90ee90" }}>{successMessage}</p>
          <Link href="/pain-points" style={buttonStyle}>
            Return to Pain Points
          </Link>
        </div>
      )}

      {!loading && painPoint && !successMessage && (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Selected Pain Point</h2>

            {renderCheckbox(
              "pain_point",
              painPoint.id,
              painPoint.name,
              `Category: ${painPoint.category || "None"} | Created: ${formatDate(
                painPoint.created_at
              )}`
            )}

            <p style={{ color: "#aaa", whiteSpace: "pre-wrap", marginTop: "16px" }}>
              {painPoint.description || "No description saved."}
            </p>
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
              <strong>Total selected:</strong> {selectedCount}
              <br />
              <span style={{ color: "#aaa" }}>
                Default selection is pain point only. Relationship links start unchecked.
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={selectAll} style={buttonStyle}>
                Select All
              </button>

              <button type="button" onClick={unselectAll} style={buttonStyle}>
                Unselect All
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Company Links ({linkedCompanies.length})</h2>

            {linkedCompanies.length === 0 && (
              <p style={{ color: "#aaa" }}>No company links.</p>
            )}

            {linkedCompanies.map((linkedCompany) => {
              const company = singleRelation(linkedCompany.companies);

              return renderCheckbox(
                "company_link",
                linkedCompany.id,
                company?.name || "Missing company record",
                `Removes link only. Company ID: ${linkedCompany.company_id}`
              );
            })}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Contact Links ({linkedContacts.length})</h2>

            {linkedContacts.length === 0 && (
              <p style={{ color: "#aaa" }}>No contact links.</p>
            )}

            {linkedContacts.map((linkedContact) => {
              const contact = singleRelation(linkedContact.contacts);

              return renderCheckbox(
                "contact_link",
                linkedContact.id,
                contact
                  ? `${contact.first_name} ${contact.last_name || ""}`
                  : "Missing contact record",
                `Removes link only. Contact ID: ${linkedContact.contact_id}`
              );
            })}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Activity Links ({linkedActivities.length})</h2>

            {linkedActivities.length === 0 && (
              <p style={{ color: "#aaa" }}>No activity links.</p>
            )}

            {linkedActivities.map((linkedActivity) => {
              const activity = singleRelation(linkedActivity.activities);

              return renderCheckbox(
                "activity_link",
                linkedActivity.id,
                activity?.subject || "Missing activity record",
                `Removes link only. Activity date: ${
                  activity?.activity_date || "No date"
                }`
              );
            })}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Post Links ({linkedPosts.length})</h2>

            {linkedPosts.length === 0 && (
              <p style={{ color: "#aaa" }}>No post links.</p>
            )}

            {linkedPosts.map((linkedPost) => {
              const post = singleRelation(linkedPost.posts);

              return renderCheckbox(
                "post_link",
                linkedPost.id,
                post?.title || "Missing post record",
                `Removes link only. Post ID: ${linkedPost.post_id}`
              );
            })}
          </div>

          <div
            style={{
              ...cardStyle,
              borderColor: "#8f2f2f",
              backgroundColor: "#201111",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Final Delete Action</h2>

            <p>
              Selected records: <strong>{selectedCount}</strong>
            </p>

            <p style={{ color: "#ffb3b3" }}>
              This action cannot be undone from inside Sell It yet.
            </p>

            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={selectedCount === 0 || deleting}
              style={dangerButtonStyle}
            >
              Review Final Confirmation
            </button>
          </div>

          {confirming && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.78)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <div
                style={{
                  ...cardStyle,
                  maxWidth: "560px",
                  borderColor: "#ff9999",
                  backgroundColor: "#1a1a1a",
                }}
              >
                <h2 style={{ marginTop: 0 }}>Confirm Delete</h2>

                <p>
                  You are about to delete <strong>{selectedCount}</strong>{" "}
                  selected pain point/link item(s) for{" "}
                  <strong>{painPoint.name}</strong>.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    style={dangerButtonStyle}
                  >
                    {deleting ? "Deleting..." : "Yes, Delete Selected Records"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    style={buttonStyle}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
