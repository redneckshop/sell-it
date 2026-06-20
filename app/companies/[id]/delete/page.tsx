"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../../../lib/supabase";

type Company = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  lead_temperature: string | null;
  created_at: string | null;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_id: string | null;
};

type Opportunity = {
  id: string;
  name: string;
  opportunity_type: string | null;
  stage: string | null;
  lead_temperature: string | null;
  estimated_monthly_value: number | null;
  company_id: string | null;
  primary_contact_id: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
};

type Activity = {
  id: string;
  subject: string;
  activity_type: string | null;
  activity_date: string | null;
  outcome: string | null;
  follow_up_needed: boolean | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  task_id: string | null;
};

type Note = {
  id: string;
  title: string;
  source: string | null;
  tags: string | null;
  created_at: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
};

type PainPointCompanyLink = {
  id: string;
  pain_point_id: string;
  company_id: string;
  pain_points: {
    id: string;
    name: string;
    category: string | null;
  } | null;
};

type AttachmentRecord = {
  id: string;
  file_name: string;
  file_type: string | null;
  created_at: string | null;
  relation_type: string;
  relation_id: string;
};

type DeleteType =
  | "company"
  | "contact"
  | "opportunity"
  | "task"
  | "activity"
  | "note"
  | "pain_point_company_link"
  | "attachment";

type SelectedMap = Record<string, boolean>;

type RawAttachment = {
  id: string;
  file_name: string;
  file_type: string | null;
  created_at: string | null;
  [key: string]: string | null;
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

function formatCurrency(value: number | null) {
  if (value === null) return "Not provided";
  return `$${Number(value).toLocaleString()}`;
}

function fullName(contact: Contact) {
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function uniqueRowsById<T extends { id: string }>(rows: T[]) {
  const map = new Map<string, T>();

  rows.forEach((row) => {
    if (!map.has(row.id)) {
      map.set(row.id, row);
    }
  });

  return Array.from(map.values());
}

export default function DeleteCompanyPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [painPointCompanyLinks, setPainPointCompanyLinks] = useState<
    PainPointCompanyLink[]
  >([]);
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});

  const allKeys = useMemo(() => {
    const keys: string[] = [];

    if (company) keys.push(recordKey("company", company.id));
    contacts.forEach((row) => keys.push(recordKey("contact", row.id)));
    opportunities.forEach((row) => keys.push(recordKey("opportunity", row.id)));
    tasks.forEach((row) => keys.push(recordKey("task", row.id)));
    activities.forEach((row) => keys.push(recordKey("activity", row.id)));
    notes.forEach((row) => keys.push(recordKey("note", row.id)));
    painPointCompanyLinks.forEach((row) =>
      keys.push(recordKey("pain_point_company_link", row.id))
    );
    attachments.forEach((row) => keys.push(recordKey("attachment", row.id)));

    return keys;
  }, [
    company,
    contacts,
    opportunities,
    tasks,
    activities,
    notes,
    painPointCompanyLinks,
    attachments,
  ]);

  const selectedCount = countSelected(selected);

  useEffect(() => {
    async function loadAttachmentsByRelation(
      column: string,
      ids: string[],
      relationType: string
    ) {
      if (ids.length === 0) return [] as AttachmentRecord[];

      const { data, error } = await supabase
        .from("attachments")
        .select(`id, file_name, file_type, created_at, ${column}`)
        .in(column, ids)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const rows = (data ?? []) as unknown as RawAttachment[];

      return rows.map((row) => ({
        id: row.id,
        file_name: row.file_name,
        file_type: row.file_type,
        created_at: row.created_at,
        relation_type: relationType,
        relation_id: String(row[column] || ""),
      }));
    }

    async function loadDeleteReview() {
      setLoading(true);
      setErrorMessage("");

      try {
        const { data: companyRow, error: companyError } = await supabase
          .from("companies")
          .select("id, name, website, phone, email, lead_temperature, created_at")
          .eq("id", companyId)
          .single();

        if (companyError) {
          throw new Error(companyError.message);
        }

        const [
          contactResult,
          opportunityResult,
          taskResult,
          activityResult,
          noteResult,
          painPointCompanyLinkResult,
        ] = await Promise.all([
          supabase
            .from("contacts")
            .select("id, first_name, last_name, email, phone, title, company_id")
            .eq("company_id", companyId)
            .order("first_name", { ascending: true }),

          supabase
            .from("opportunities")
            .select(
              "id, name, opportunity_type, stage, lead_temperature, estimated_monthly_value, company_id, primary_contact_id"
            )
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),

          supabase
            .from("tasks")
            .select(
              "id, title, status, priority, due_date, company_id, contact_id, opportunity_id"
            )
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),

          supabase
            .from("activities")
            .select(
              "id, subject, activity_type, activity_date, outcome, follow_up_needed, company_id, contact_id, opportunity_id, task_id"
            )
            .eq("company_id", companyId)
            .order("activity_date", { ascending: false }),

          supabase
            .from("notes")
            .select(
              "id, title, source, tags, created_at, company_id, contact_id, opportunity_id"
            )
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),

          supabase
            .from("pain_point_companies")
            .select("id, pain_point_id, company_id, pain_points(id, name, category)")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),
        ]);

        const firstError =
          contactResult.error ||
          opportunityResult.error ||
          taskResult.error ||
          activityResult.error ||
          noteResult.error ||
          painPointCompanyLinkResult.error;

        if (firstError) {
          throw new Error(firstError.message);
        }

        const loadedCompany = companyRow as Company;
        const loadedContacts = (contactResult.data ?? []) as Contact[];
        const loadedOpportunities = (opportunityResult.data ?? []) as Opportunity[];
        const loadedTasks = (taskResult.data ?? []) as Task[];
        const loadedActivities = (activityResult.data ?? []) as Activity[];
        const loadedNotes = (noteResult.data ?? []) as Note[];
        const loadedPainPointCompanyLinks = (painPointCompanyLinkResult.data ??
          []) as unknown as PainPointCompanyLink[];

        const contactIds = loadedContacts.map((row) => row.id);
        const opportunityIds = loadedOpportunities.map((row) => row.id);
        const taskIds = loadedTasks.map((row) => row.id);
        const activityIds = loadedActivities.map((row) => row.id);
        const noteIds = loadedNotes.map((row) => row.id);

        const loadedAttachments = uniqueRowsById([
          ...(await loadAttachmentsByRelation(
            "related_company_id",
            [companyId],
            "Direct company attachment"
          )),
          ...(await loadAttachmentsByRelation(
            "related_contact_id",
            contactIds,
            "Contact attachment"
          )),
          ...(await loadAttachmentsByRelation(
            "related_opportunity_id",
            opportunityIds,
            "Opportunity attachment"
          )),
          ...(await loadAttachmentsByRelation(
            "related_task_id",
            taskIds,
            "Task attachment"
          )),
          ...(await loadAttachmentsByRelation(
            "related_activity_id",
            activityIds,
            "Activity attachment"
          )),
          ...(await loadAttachmentsByRelation(
            "related_note_id",
            noteIds,
            "Note attachment"
          )),
        ]);

        setCompany(loadedCompany);
        setContacts(loadedContacts);
        setOpportunities(loadedOpportunities);
        setTasks(loadedTasks);
        setActivities(loadedActivities);
        setNotes(loadedNotes);
        setPainPointCompanyLinks(loadedPainPointCompanyLinks);
        setAttachments(loadedAttachments);
        setSelected({
          [recordKey("company", loadedCompany.id)]: true,
        });

        setLoading(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown load error";
        setErrorMessage(message);
        setLoading(false);
      }
    }

    loadDeleteReview();
  }, [companyId]);

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

  async function updateIdsToNull(table: string, column: string, ids: string[]) {
    if (ids.length === 0) return;

    const { error } = await supabase
      .from(table)
      .update({ [column]: null })
      .in("id", ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function updateWhereInToNull(
    table: string,
    columnToUpdate: string,
    matchColumn: string,
    matchIds: string[]
  ) {
    if (matchIds.length === 0) return;

    const { error } = await supabase
      .from(table)
      .update({ [columnToUpdate]: null })
      .in(matchColumn, matchIds);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function updateWhereEqToNull(
    table: string,
    columnToUpdate: string,
    matchColumn: string,
    matchValue: string
  ) {
    const { error } = await supabase
      .from(table)
      .update({ [columnToUpdate]: null })
      .eq(matchColumn, matchValue);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function deleteWhereIn(
    table: string,
    matchColumn: string,
    matchIds: string[]
  ) {
    if (matchIds.length === 0) return;

    const { error } = await supabase.from(table).delete().in(matchColumn, matchIds);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function deleteWhereEq(
    table: string,
    matchColumn: string,
    matchValue: string
  ) {
    const { error } = await supabase.from(table).delete().eq(matchColumn, matchValue);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function handleDeleteSelected() {
    if (!company || selectedCount === 0) return;

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const companySelected = isChecked("company", company.id);

      const selectedContactIds = idsFor("contact", contacts);
      const selectedOpportunityIds = idsFor("opportunity", opportunities);
      const selectedTaskIds = idsFor("task", tasks);
      const selectedActivityIds = idsFor("activity", activities);
      const selectedNoteIds = idsFor("note", notes);
      const selectedPainPointCompanyLinkIds = idsFor(
        "pain_point_company_link",
        painPointCompanyLinks
      );
      const selectedAttachmentIds = idsFor("attachment", attachments);

      await deleteIds("attachments", selectedAttachmentIds);

      await deleteIds("pain_point_companies", selectedPainPointCompanyLinkIds);

      await updateWhereInToNull(
        "attachments",
        "related_contact_id",
        "related_contact_id",
        selectedContactIds
      );
      await updateWhereInToNull(
        "attachments",
        "related_opportunity_id",
        "related_opportunity_id",
        selectedOpportunityIds
      );
      await updateWhereInToNull(
        "attachments",
        "related_task_id",
        "related_task_id",
        selectedTaskIds
      );
      await updateWhereInToNull(
        "attachments",
        "related_activity_id",
        "related_activity_id",
        selectedActivityIds
      );
      await updateWhereInToNull(
        "attachments",
        "related_note_id",
        "related_note_id",
        selectedNoteIds
      );

      await deleteWhereIn("pain_point_contacts", "contact_id", selectedContactIds);
      await deleteWhereIn("pain_point_activities", "activity_id", selectedActivityIds);

      await updateWhereInToNull(
        "opportunities",
        "primary_contact_id",
        "primary_contact_id",
        selectedContactIds
      );
      await updateWhereInToNull("tasks", "contact_id", "contact_id", selectedContactIds);
      await updateWhereInToNull(
        "activities",
        "contact_id",
        "contact_id",
        selectedContactIds
      );
      await updateWhereInToNull("notes", "contact_id", "contact_id", selectedContactIds);

      await updateWhereInToNull(
        "tasks",
        "opportunity_id",
        "opportunity_id",
        selectedOpportunityIds
      );
      await updateWhereInToNull(
        "activities",
        "opportunity_id",
        "opportunity_id",
        selectedOpportunityIds
      );
      await updateWhereInToNull(
        "notes",
        "opportunity_id",
        "opportunity_id",
        selectedOpportunityIds
      );

      await updateWhereInToNull("activities", "task_id", "task_id", selectedTaskIds);

      await deleteIds("notes", selectedNoteIds);
      await deleteIds("activities", selectedActivityIds);
      await deleteIds("tasks", selectedTaskIds);
      await deleteIds("opportunities", selectedOpportunityIds);
      await deleteIds("contacts", selectedContactIds);

      if (companySelected) {
        const remainingContactIds = contacts
          .filter((row) => !selectedContactIds.includes(row.id))
          .map((row) => row.id);

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

        await updateWhereEqToNull(
          "attachments",
          "related_company_id",
          "related_company_id",
          company.id
        );

        await deleteWhereEq("pain_point_companies", "company_id", company.id);

        await updateIdsToNull("contacts", "company_id", remainingContactIds);
        await updateIdsToNull("opportunities", "company_id", remainingOpportunityIds);
        await updateIdsToNull("tasks", "company_id", remainingTaskIds);
        await updateIdsToNull("activities", "company_id", remainingActivityIds);
        await updateIdsToNull("notes", "company_id", remainingNoteIds);

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
        <Link href="/companies" style={secondaryButtonStyle}>
          Back to Companies
        </Link>

        {company && (
          <Link href={`/companies/${company.id}`} style={secondaryButtonStyle}>
            Back to Company
          </Link>
        )}
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Permanent Delete Review</p>

        <h1 style={titleStyle}>Delete Company Review</h1>

        <p style={mutedTextStyle}>
          Review this company and its directly related records before permanent
          delete. Only checked records are deleted. Unchecked related records are
          preserved and safely unlinked when possible.
        </p>
      </header>

      <section style={warningCardStyle}>
        <h2 style={{ marginTop: 0 }}>Archive Recommended First</h2>

        <p style={{ color: "#fde68a", lineHeight: 1.6 }}>
          Archive should be the normal workflow for old, inactive, duplicate, or
          uncertain records. Permanent delete remains available, but should be
          reserved for records you are sure should be removed from Sell It.
        </p>

        {company && (
          <Link href={`/companies/${company.id}`} style={secondaryButtonStyle}>
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
          <Link href="/companies" style={secondaryButtonStyle}>
            Return to Companies
          </Link>
        </section>
      )}

      {!loading && company && !successMessage && (
        <>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Selected Company</h2>

            {renderCheckbox(
              "company",
              company.id,
              company.name,
              `Lead Temperature: ${company.lead_temperature || "None"} | Phone: ${
                company.phone || "None"
              } | Email: ${company.email || "None"}`
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
                Default selection is company only. Related records start unchecked.
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
            <h2 style={{ marginTop: 0 }}>Contacts ({contacts.length})</h2>

            {contacts.length === 0 && <p style={emptyTextStyle}>No contacts.</p>}

            {contacts.map((contact) =>
              renderCheckbox(
                "contact",
                contact.id,
                fullName(contact),
                `Title: ${contact.title || "None"} | Phone: ${
                  contact.phone || "None"
                } | Email: ${contact.email || "None"}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Opportunities ({opportunities.length})</h2>

            {opportunities.length === 0 && (
              <p style={emptyTextStyle}>No opportunities.</p>
            )}

            {opportunities.map((opportunity) =>
              renderCheckbox(
                "opportunity",
                opportunity.id,
                opportunity.name,
                `Type: ${opportunity.opportunity_type || "None"} | Stage: ${
                  opportunity.stage || "None"
                } | Value: ${formatCurrency(opportunity.estimated_monthly_value)}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Tasks ({tasks.length})</h2>

            {tasks.length === 0 && <p style={emptyTextStyle}>No tasks.</p>}

            {tasks.map((task) =>
              renderCheckbox(
                "task",
                task.id,
                task.title,
                `Status: ${task.status || "None"} | Priority: ${
                  task.priority || "None"
                } | Due: ${task.due_date || "None"}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Activities ({activities.length})</h2>

            {activities.length === 0 && (
              <p style={emptyTextStyle}>No activities.</p>
            )}

            {activities.map((activity) =>
              renderCheckbox(
                "activity",
                activity.id,
                activity.subject,
                `Type: ${activity.activity_type || "None"} | Outcome: ${
                  activity.outcome || "None"
                } | Date: ${formatDate(activity.activity_date)}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Notes ({notes.length})</h2>

            {notes.length === 0 && <p style={emptyTextStyle}>No notes.</p>}

            {notes.map((note) =>
              renderCheckbox(
                "note",
                note.id,
                note.title,
                `Source: ${note.source || "None"} | Tags: ${
                  note.tags || "None"
                } | Created: ${formatDate(note.created_at)}`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>
              Pain Point Company Links ({painPointCompanyLinks.length})
            </h2>

            {painPointCompanyLinks.length === 0 && (
              <p style={emptyTextStyle}>No pain point company links.</p>
            )}

            {painPointCompanyLinks.map((link) =>
              renderCheckbox(
                "pain_point_company_link",
                link.id,
                link.pain_points?.name || "Missing pain point record",
                `Removes link only. Category: ${
                  link.pain_points?.category || "None"
                }`
              )
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>
              Attachments Tied To Company Or Related Records ({attachments.length})
            </h2>

            {attachments.length === 0 && (
              <p style={emptyTextStyle}>No related attachments.</p>
            )}

            {attachments.map((attachment) =>
              renderCheckbox(
                "attachment",
                attachment.id,
                attachment.file_name,
                `${attachment.relation_type} | Type: ${
                  attachment.file_type || "None"
                } | Created: ${formatDate(attachment.created_at)}`
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
                  <strong>{selectedCount}</strong> selected item(s) for company{" "}
                  <strong>{company.name}</strong>.
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