"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type SupabaseRelation<T> = T | T[] | null;

type RelatedCompany = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  workspace_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
  company_id: string | null;
  companies: SupabaseRelation<RelatedCompany>;
};

type Opportunity = {
  id: string;
  name: string;
  stage: string | null;
  lead_temperature: string | null;
  primary_contact_id: string | null;
  company_id: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  contact_id: string | null;
  company_id: string | null;
};

type Activity = {
  id: string;
  subject: string;
  activity_type: string | null;
  outcome: string | null;
  activity_date: string | null;
  contact_id: string | null;
  company_id: string | null;
};

type Note = {
  id: string;
  title: string;
  source: string | null;
  created_at: string | null;
  contact_id: string | null;
  company_id: string | null;
  opportunity_id: string | null;
};

type Attachment = {
  id: string;
  file_name: string;
  file_type: string | null;
  related_contact_id: string | null;
  created_at: string | null;
};

type PainPoint = {
  id: string;
  name: string;
  category: string | null;
};

type PainPointRelationship = {
  id: string;
  pain_point_id: string;
  contact_id: string;
  pain_points: SupabaseRelation<PainPoint>;
};

type DeleteType =
  | "contact"
  | "company"
  | "opportunity"
  | "task"
  | "activity"
  | "note"
  | "attachment"
  | "painPointRelationship";

type SelectedMap = Record<string, boolean>;

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

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px",
  flexWrap: "wrap",
  alignItems: "center",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "44px",
  color: "#e2e8f0",
  backgroundColor: "rgba(15, 23, 42, 0.82)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  padding: "10px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "44px",
  color: "#fecaca",
  backgroundColor: "rgba(127, 29, 29, 0.28)",
  border: "1px solid rgba(248, 113, 113, 0.45)",
  padding: "10px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
};

const disabledDangerButtonStyle: CSSProperties = {
  ...dangerButtonStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

const headerStyle: CSSProperties = {
  marginBottom: "24px",
  border: "1px solid rgba(248, 113, 113, 0.28)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(239, 68, 68, 0.20), transparent 34%), linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.88))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#fca5a5",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "34px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  maxWidth: "900px",
  lineHeight: 1.55,
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "22px",
  padding: "22px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  marginBottom: "16px",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const warningCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(245, 158, 11, 0.38)",
  background:
    "linear-gradient(135deg, rgba(120, 53, 15, 0.35), rgba(15, 23, 42, 0.92))",
};

const dangerCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(248, 113, 113, 0.42)",
  background:
    "linear-gradient(135deg, rgba(127, 29, 29, 0.36), rgba(15, 23, 42, 0.92))",
};

const successCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(74, 222, 128, 0.34)",
  background:
    "linear-gradient(135deg, rgba(20, 83, 45, 0.30), rgba(15, 23, 42, 0.92))",
};

const checkboxRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: "12px",
  alignItems: "flex-start",
  padding: "12px",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)",
  backgroundColor: "rgba(15, 23, 42, 0.24)",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  fontWeight: 800,
};

const emptyTextStyle: CSSProperties = {
  color: "#94a3b8",
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function recordKey(type: DeleteType, id: string) {
  return `${type}:${id}`;
}

function formatContactName(contact: Contact | null) {
  if (!contact) return "Unknown Contact";
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function countSelected(selected: SelectedMap) {
  return Object.values(selected).filter(Boolean).length;
}

function labelForPainPointRelationship(row: PainPointRelationship) {
  const painPoint = singleRelation(row.pain_points);

  return painPoint
    ? `${painPoint.name}${painPoint.category ? ` - ${painPoint.category}` : ""}`
    : `Pain point relationship ${row.id}`;
}

export default function DeleteContactPage() {
  const params = useParams<{ id: string }>();
  const contactId = params.id;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<RelatedCompany | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [painPointRelationships, setPainPointRelationships] = useState<
    PainPointRelationship[]
  >([]);
  const [selected, setSelected] = useState<SelectedMap>({});

  const allKeys = useMemo(() => {
    const keys: string[] = [];

    if (contact) keys.push(recordKey("contact", contact.id));
    if (company) keys.push(recordKey("company", company.id));

    opportunities.forEach((row) => keys.push(recordKey("opportunity", row.id)));
    tasks.forEach((row) => keys.push(recordKey("task", row.id)));
    activities.forEach((row) => keys.push(recordKey("activity", row.id)));
    notes.forEach((row) => keys.push(recordKey("note", row.id)));
    attachments.forEach((row) => keys.push(recordKey("attachment", row.id)));
    painPointRelationships.forEach((row) =>
      keys.push(recordKey("painPointRelationship", row.id))
    );

    return keys;
  }, [
    contact,
    company,
    opportunities,
    tasks,
    activities,
    notes,
    attachments,
    painPointRelationships,
  ]);

  const selectedCount = countSelected(selected);

  useEffect(() => {
    async function loadDeleteReview() {
      setLoading(true);
      setErrorMessage("");

      const { data: contactRow, error: contactError } = await supabase
        .from("contacts")
        .select(`
          id,
          workspace_id,
          first_name,
          last_name,
          email,
          phone,
          title,
          notes,
          company_id,
          companies (
            id,
            name
          )
        `)
        .eq("id", contactId)
        .single();

      if (contactError) {
        setErrorMessage(contactError.message);
        setLoading(false);
        return;
      }

      const loadedContact = contactRow as unknown as Contact;
      const loadedCompany = singleRelation(loadedContact.companies);

      const [
        opportunityResult,
        taskResult,
        activityResult,
        noteResult,
        attachmentResult,
        painPointResult,
      ] = await Promise.all([
        supabase
          .from("opportunities")
          .select("id, name, stage, lead_temperature, primary_contact_id, company_id")
          .eq("primary_contact_id", contactId)
          .order("created_at", { ascending: false }),

        supabase
          .from("tasks")
          .select("id, title, status, priority, contact_id, company_id")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false }),

        supabase
          .from("activities")
          .select("id, subject, activity_type, outcome, activity_date, contact_id, company_id")
          .eq("contact_id", contactId)
          .order("activity_date", { ascending: false }),

        supabase
          .from("notes")
          .select("id, title, source, created_at, contact_id, company_id, opportunity_id")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false }),

        supabase
          .from("attachments")
          .select("id, file_name, file_type, related_contact_id, created_at")
          .eq("related_contact_id", contactId)
          .order("created_at", { ascending: false }),

        supabase
          .from("pain_point_contacts")
          .select("id, pain_point_id, contact_id, pain_points(id, name, category)")
          .eq("contact_id", contactId),
      ]);

      const firstError =
        opportunityResult.error ||
        taskResult.error ||
        activityResult.error ||
        noteResult.error ||
        attachmentResult.error ||
        painPointResult.error;

      if (firstError) {
        setErrorMessage(firstError.message);
        setLoading(false);
        return;
      }

      setContact(loadedContact);
      setCompany(loadedCompany);
      setOpportunities((opportunityResult.data ?? []) as unknown as Opportunity[]);
      setTasks((taskResult.data ?? []) as unknown as Task[]);
      setActivities((activityResult.data ?? []) as unknown as Activity[]);
      setNotes((noteResult.data ?? []) as unknown as Note[]);
      setAttachments((attachmentResult.data ?? []) as unknown as Attachment[]);
      setPainPointRelationships(
        (painPointResult.data ?? []) as unknown as PainPointRelationship[]
      );

      setSelected({
        [recordKey("contact", loadedContact.id)]: true,
      });

      setLoading(false);
    }

    loadDeleteReview();
  }, [contactId]);

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

  async function detachIds(table: string, column: string, ids: string[]) {
    if (ids.length === 0) return;

    const { error } = await supabase
      .from(table)
      .update({ [column]: null })
      .in("id", ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function handleDeleteSelected() {
    if (!contact || selectedCount === 0) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const contactSelected = isChecked("contact", contact.id);
      const companySelected = company ? isChecked("company", company.id) : false;

      const selectedOpportunityIds = idsFor("opportunity", opportunities);
      const selectedTaskIds = idsFor("task", tasks);
      const selectedActivityIds = idsFor("activity", activities);
      const selectedNoteIds = idsFor("note", notes);
      const selectedAttachmentIds = idsFor("attachment", attachments);
      const selectedPainPointRelationshipIds = idsFor(
        "painPointRelationship",
        painPointRelationships
      );

      await deleteIds("pain_point_contacts", selectedPainPointRelationshipIds);
      await deleteIds("attachments", selectedAttachmentIds);
      await deleteIds("notes", selectedNoteIds);
      await deleteIds("activities", selectedActivityIds);
      await deleteIds("tasks", selectedTaskIds);
      await deleteIds("opportunities", selectedOpportunityIds);

      if (contactSelected) {
        const remainingOpportunityIds = opportunities
          .filter((row) => !selectedOpportunityIds.includes(row.id))
          .map((row) => row.id);

        const remainingTaskIds = tasks
          .filter((row) => !selectedTaskIds.includes(row.id))
          .map((row) => row.id);

        const remainingActivityIds = activities
          .filter((row) => !selectedActivityIds.includes(row.id))
          .map((row) => row.id);

        const remainingNoteIds = notes
          .filter((row) => !selectedNoteIds.includes(row.id))
          .map((row) => row.id);

        const remainingAttachmentIds = attachments
          .filter((row) => !selectedAttachmentIds.includes(row.id))
          .map((row) => row.id);

        await detachIds("opportunities", "primary_contact_id", remainingOpportunityIds);
        await detachIds("tasks", "contact_id", remainingTaskIds);
        await detachIds("activities", "contact_id", remainingActivityIds);
        await detachIds("notes", "contact_id", remainingNoteIds);
        await detachIds("attachments", "related_contact_id", remainingAttachmentIds);

        const { error: painPointDetachError } = await supabase
          .from("pain_point_contacts")
          .delete()
          .eq("contact_id", contact.id);

        if (painPointDetachError) {
          throw new Error(painPointDetachError.message);
        }

        await deleteIds("contacts", [contact.id]);
      }

      if (companySelected && company) {
        await deleteIds("companies", [company.id]);
      }

      setSuccessMessage(
        `Delete complete. Deleted or safely unlinked ${selectedCount} selected item(s).`
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
          style={{
            width: "18px",
            height: "18px",
            marginTop: "2px",
            accentColor: "#f87171",
          }}
        />
        <span>
          <strong>{title}</strong>
          <br />
          <span style={{ color: "#94a3b8" }}>{details}</span>
        </span>
      </label>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={actionRowStyle}>
        <Link href="/contacts" style={secondaryButtonStyle}>
          Back to Contacts
        </Link>

        {contact && (
          <Link href={`/contacts/${contact.id}`} style={secondaryButtonStyle}>
            Back to Contact
          </Link>
        )}
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Permanent Delete Review</p>

        <h1 style={titleStyle}>Delete Contact Review</h1>

        <p style={mutedTextStyle}>
          Review everything connected to this contact before permanent delete.
          Only checked records are deleted. Unchecked related records are
          preserved and safely unlinked from the deleted contact when possible.
        </p>
      </header>

      <section style={warningCardStyle}>
        <h2 style={{ marginTop: 0 }}>Archive Recommended First</h2>

        <p style={{ color: "#fde68a", lineHeight: 1.6 }}>
          Archive should be the normal workflow for old, inactive, duplicate, or
          uncertain records. Permanent delete remains available, but should be
          reserved for records you are sure should be removed from Sell It.
        </p>

        {contact && (
          <Link href={`/contacts/${contact.id}`} style={secondaryButtonStyle}>
            Go Back and Archive Instead
          </Link>
        )}
      </section>

      {loading && (
        <section style={cardStyle}>
          <p style={{ margin: 0, color: "#cbd5e1" }}>Loading delete review...</p>
        </section>
      )}

      {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

      {successMessage && (
        <section style={successCardStyle}>
          <h2 style={{ marginTop: 0 }}>Delete Complete</h2>
          <p style={{ color: "#bbf7d0" }}>{successMessage}</p>
          <Link href="/contacts" style={secondaryButtonStyle}>
            Return to Contacts
          </Link>
        </section>
      )}

      {!loading && contact && !successMessage && (
        <>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Selected Contact</h2>

            {renderCheckbox(
              "contact",
              contact.id,
              formatContactName(contact),
              `Title: ${contact.title || "None"} | Phone: ${
                contact.phone || "None"
              } | Email: ${contact.email || "None"}`
            )}
          </section>

          <section
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
              <span style={{ color: "#94a3b8" }}>
                Default selection is contact only. Related records start unchecked.
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={selectAll} style={secondaryButtonStyle}>
                Select All
              </button>

              <button type="button" onClick={unselectAll} style={secondaryButtonStyle}>
                Unselect All
              </button>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Company ({company ? 1 : 0})</h2>

            {!company && <p style={emptyTextStyle}>No linked company.</p>}

            {company &&
              renderCheckbox(
                "company",
                company.id,
                company.name,
                "Company deletion is optional and unchecked by default."
              )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Opportunities ({opportunities.length})</h2>

            {opportunities.length === 0 && (
              <p style={emptyTextStyle}>No related opportunities.</p>
            )}

            {opportunities.map((opportunity) =>
              renderCheckbox(
                "opportunity",
                opportunity.id,
                opportunity.name,
                `Stage: ${opportunity.stage || "None"} | Temperature: ${
                  opportunity.lead_temperature || "None"
                }`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Tasks ({tasks.length})</h2>

            {tasks.length === 0 && <p style={emptyTextStyle}>No related tasks.</p>}

            {tasks.map((task) =>
              renderCheckbox(
                "task",
                task.id,
                task.title,
                `Status: ${task.status || "None"} | Priority: ${
                  task.priority || "None"
                }`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Activities ({activities.length})</h2>

            {activities.length === 0 && (
              <p style={emptyTextStyle}>No related activities.</p>
            )}

            {activities.map((activity) =>
              renderCheckbox(
                "activity",
                activity.id,
                activity.subject,
                `Type: ${activity.activity_type || "None"} | Date: ${formatDate(
                  activity.activity_date
                )}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Notes ({notes.length})</h2>

            {notes.length === 0 && <p style={emptyTextStyle}>No related notes.</p>}

            {notes.map((note) =>
              renderCheckbox(
                "note",
                note.id,
                note.title,
                `Source: ${note.source || "None"} | Created: ${formatDate(
                  note.created_at
                )}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Attachments ({attachments.length})</h2>

            {attachments.length === 0 && (
              <p style={emptyTextStyle}>No related attachments.</p>
            )}

            {attachments.map((attachment) =>
              renderCheckbox(
                "attachment",
                attachment.id,
                attachment.file_name,
                `Type: ${attachment.file_type || "None"} | Created: ${formatDate(
                  attachment.created_at
                )}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>
              Pain Point Relationships ({painPointRelationships.length})
            </h2>

            {painPointRelationships.length === 0 && (
              <p style={emptyTextStyle}>No pain point relationships.</p>
            )}

            {painPointRelationships.map((relationship) =>
              renderCheckbox(
                "painPointRelationship",
                relationship.id,
                labelForPainPointRelationship(relationship),
                "This removes the relationship link only. It does not delete the pain point record."
              )
            )}
          </section>

          <section style={dangerCardStyle}>
            <h2 style={{ marginTop: 0 }}>Final Delete Action</h2>

            <p>
              Selected records: <strong>{selectedCount}</strong>
            </p>

            <p style={{ color: "#fecaca", lineHeight: 1.6 }}>
              Permanent delete cannot be undone from inside Sell It. Use Archive
              first unless you are sure this record should be removed.
            </p>

            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={selectedCount === 0 || deleting}
              style={
                selectedCount === 0 || deleting
                  ? disabledDangerButtonStyle
                  : dangerButtonStyle
              }
            >
              Review Final Confirmation
            </button>
          </section>

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
                zIndex: 50,
              }}
            >
              <section
                style={{
                  ...dangerCardStyle,
                  maxWidth: "560px",
                  marginBottom: 0,
                }}
              >
                <h2 style={{ marginTop: 0 }}>Confirm Delete</h2>

                <p>
                  You are about to delete or unlink{" "}
                  <strong>{selectedCount}</strong> selected item(s) for{" "}
                  <strong>{formatContactName(contact)}</strong>.
                </p>

                <p style={{ color: "#fecaca" }}>
                  Company records are not deleted unless their checkbox was
                  selected.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    style={deleting ? disabledDangerButtonStyle : dangerButtonStyle}
                  >
                    {deleting ? "Deleting..." : "Yes, Delete Selected Records"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            </div>
          )}
        </>
      )}
      </section>
    </main>
  );
}