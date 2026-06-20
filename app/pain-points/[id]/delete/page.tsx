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
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "1080px",
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
  color: "#fda4af",
  fontSize: "13px",
  fontWeight: 900,
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
  maxWidth: "820px",
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
  padding: "20px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
  marginBottom: "16px",
};

const warningCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(251, 113, 133, 0.42)",
  background:
    "linear-gradient(135deg, rgba(127, 29, 29, 0.42), rgba(15, 23, 42, 0.94))",
};

const successCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(74, 222, 128, 0.35)",
  background:
    "linear-gradient(135deg, rgba(20, 83, 45, 0.35), rgba(15, 23, 42, 0.94))",
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  color: "#e2e8f0",
  backgroundColor: "rgba(15, 23, 42, 0.82)",
  padding: "10px 15px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(148, 163, 184, 0.28)",
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  color: "#fff1f2",
  background: "linear-gradient(135deg, #be123c, #fb7185)",
  border: "1px solid rgba(251, 113, 133, 0.55)",
  boxShadow: "0 18px 36px rgba(190, 18, 60, 0.22)",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const checkboxRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px 1fr",
  gap: "10px",
  alignItems: "flex-start",
  padding: "13px",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)",
};

const labelStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: 800,
};

const mutedTextStyle: CSSProperties = {
  color: "#94a3b8",
};

const errorMessageStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.32)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "12px 14px",
  borderRadius: "16px",
  marginBottom: "18px",
  fontWeight: 800,
};

const countPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "34px",
  minHeight: "28px",
  borderRadius: "999px",
  padding: "4px 10px",
  color: "#fecdd3",
  backgroundColor: "rgba(127, 29, 29, 0.34)",
  border: "1px solid rgba(251, 113, 133, 0.38)",
  fontWeight: 900,
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

function contactName(contact: Contact) {
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
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
    linkedCompanies.forEach((row) =>
      keys.push(recordKey("company_link", row.id))
    );
    linkedContacts.forEach((row) =>
      keys.push(recordKey("contact_link", row.id))
    );
    linkedActivities.forEach((row) =>
      keys.push(recordKey("activity_link", row.id))
    );
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
        "Delete complete. Deleted selected pain point/link item(s). Related companies, contacts, activities, and posts were preserved."
      );
      setConfirming(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown delete error";
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
          style={{
            width: "18px",
            height: "18px",
            marginTop: "2px",
            accentColor: "#fb7185",
          }}
        />

        <span>
          <strong>{title}</strong>
          <br />
          <span style={mutedTextStyle}>{details}</span>
        </span>
      </label>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Danger Zone / Pain Point</p>
            <h1 style={titleStyle}>Delete Pain Point Review</h1>
            <p style={subtitleStyle}>
              Review this pain point and its relationship links before deleting.
              Only checked records are deleted. Linked companies, contacts,
              activities, and posts are preserved.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href="/pain-points" style={secondaryLinkStyle}>
              Back to Pain Points
            </Link>

            {painPoint && (
              <Link href={`/pain-points/${painPoint.id}`} style={secondaryLinkStyle}>
                Back to Pain Point
              </Link>
            )}
          </div>
        </div>

        {loading && (
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Loading</p>
            <h2 style={{ margin: 0 }}>Loading delete review...</h2>
            <p style={subtitleStyle}>
              Pulling the record and relationship links before any delete
              action is available.
            </p>
          </div>
        )}

        {errorMessage && <p style={errorMessageStyle}>Error: {errorMessage}</p>}

        {successMessage && (
          <div style={successCardStyle}>
            <h2 style={{ marginTop: 0 }}>Delete Complete</h2>
            <p style={{ color: "#bbf7d0", lineHeight: 1.55 }}>
              {successMessage}
            </p>
            <Link href="/pain-points" style={secondaryLinkStyle}>
              Return to Pain Points
            </Link>
          </div>
        )}

        {!loading && painPoint && !successMessage && (
          <>
            <div style={warningCardStyle}>
              <h2 style={{ marginTop: 0 }}>Selected Pain Point</h2>

              {renderCheckbox(
                "pain_point",
                painPoint.id,
                painPoint.name,
                `Category: ${painPoint.category || "None"} | Created: ${formatDate(
                  painPoint.created_at
                )}`
              )}

              <p
                style={{
                  color: painPoint.description ? "#cbd5e1" : "#94a3b8",
                  whiteSpace: "pre-wrap",
                  marginTop: "16px",
                  lineHeight: 1.6,
                }}
              >
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
                <div style={labelStyle}>Selected Records</div>
                <div style={{ marginTop: "6px" }}>
                  <span style={countPillStyle}>{selectedCount}</span>
                </div>
                <p style={{ ...mutedTextStyle, margin: "10px 0 0" }}>
                  Default selection is pain point only. Relationship links start
                  unchecked.
                </p>
              </div>

              <div style={actionRowStyle}>
                <button type="button" onClick={selectAll} style={buttonStyle}>
                  Select All
                </button>

                <button type="button" onClick={unselectAll} style={buttonStyle}>
                  Unselect All
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>
                Company Links ({linkedCompanies.length})
              </h2>

              {linkedCompanies.length === 0 && (
                <p style={mutedTextStyle}>No company links.</p>
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
              <h2 style={{ marginTop: 0 }}>
                Contact Links ({linkedContacts.length})
              </h2>

              {linkedContacts.length === 0 && (
                <p style={mutedTextStyle}>No contact links.</p>
              )}

              {linkedContacts.map((linkedContact) => {
                const contact = singleRelation(linkedContact.contacts);

                return renderCheckbox(
                  "contact_link",
                  linkedContact.id,
                  contact ? contactName(contact) : "Missing contact record",
                  `Removes link only. Contact ID: ${linkedContact.contact_id}`
                );
              })}
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>
                Activity Links ({linkedActivities.length})
              </h2>

              {linkedActivities.length === 0 && (
                <p style={mutedTextStyle}>No activity links.</p>
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
                <p style={mutedTextStyle}>No post links.</p>
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

            <div style={warningCardStyle}>
              <h2 style={{ marginTop: 0 }}>Final Delete Action</h2>

              <p>
                Selected records: <strong>{selectedCount}</strong>
              </p>

              <p style={{ color: "#fecdd3", lineHeight: 1.55 }}>
                This action cannot be undone from inside Sell It yet. Use the
                final review step to prevent accidental clicks.
              </p>

              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={selectedCount === 0 || deleting}
                style={{
                  ...dangerButtonStyle,
                  ...(selectedCount === 0 || deleting ? disabledButtonStyle : {}),
                }}
              >
                Review Final Confirmation
              </button>
            </div>

            {confirming && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 50,
                  backgroundColor: "rgba(2, 6, 23, 0.82)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    ...warningCardStyle,
                    maxWidth: "600px",
                    width: "100%",
                    marginBottom: 0,
                  }}
                >
                  <p style={eyebrowStyle}>Final Confirmation</p>
                  <h2 style={{ marginTop: 0 }}>Confirm Delete</h2>

                  <p style={{ lineHeight: 1.6 }}>
                    You are about to delete <strong>{selectedCount}</strong>{" "}
                    selected pain point/link item(s) for{" "}
                    <strong>{painPoint.name}</strong>.
                  </p>

                  <p style={{ color: "#fecdd3", lineHeight: 1.6 }}>
                    The related company, contact, activity, and post records
                    themselves will not be deleted by this action.
                  </p>

                  <div style={actionRowStyle}>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      disabled={deleting}
                      style={{
                        ...dangerButtonStyle,
                        ...(deleting ? disabledButtonStyle : {}),
                      }}
                    >
                      {deleting ? "Deleting..." : "Delete Selected Records"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={deleting}
                      style={{
                        ...buttonStyle,
                        ...(deleting ? disabledButtonStyle : {}),
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}