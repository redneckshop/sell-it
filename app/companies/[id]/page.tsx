import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";
import ArchiveRestoreButton from "../../components/ArchiveRestoreButton";
import RecordTimeline, {
  type TimelineEvent,
} from "../../components/RecordTimeline";
import RelationshipSummaryPanel, {
  type RelationshipSummaryItem,
} from "../../components/RelationshipSummaryPanel";

type SupabaseRelation<T> = T | T[] | null;

type Company = {
  id: string;
  workspace_id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  lead_temperature: string;
  operating_regions: string | null;
  assets_equipment: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  archive_reason: string | null;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  created_at: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string | null;
};

type Activity = {
  id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  outcome: string | null;
  follow_up_needed: boolean;
};

type PrimaryContact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type Opportunity = {
  id: string;
  name: string;
  opportunity_type: string;
  stage: string;
  lead_temperature: string;
  estimated_monthly_value: number | null;
  expected_close_date: string | null;
  next_step: string | null;
  created_at: string | null;
  primary_contact: SupabaseRelation<PrimaryContact>;
};

type NoteContact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type NoteOpportunity = {
  id: string;
  name: string;
};

type Note = {
  id: string;
  title: string;
  body: string | null;
  source: string | null;
  tags: string | null;
  created_at: string | null;
  contact: SupabaseRelation<NoteContact>;
  opportunity: SupabaseRelation<NoteOpportunity>;
};

type Attachment = {
  id: string;
  file_name: string | null;
  created_at: string | null;
};

type PainPoint = {
  id: string;
  name: string;
  category: string | null;
};

type PainPointCompany = {
  id: string;
  pain_point_id: string;
  created_at: string | null;
  pain_points: SupabaseRelation<PainPoint>;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const secondaryButtonStyle: CSSProperties = {
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
};

const dangerButtonStyle: CSSProperties = {
  color: "#fecaca",
  background: "rgba(127, 29, 29, 0.24)",
  border: "1px solid rgba(248, 113, 113, 0.35)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
};

const headerStyle: CSSProperties = {
  maxWidth: "1080px",
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#a78bfa",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "34px",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  maxWidth: "900px",
  lineHeight: 1.65,
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  maxWidth: "1080px",
  marginBottom: "22px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
};

const relatedCardStyle: CSSProperties = {
  display: "block",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "12px",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#f8fafc",
  textDecoration: "none",
  maxWidth: "860px",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: "38px",
  marginBottom: "14px",
  color: "#f8fafc",
};

const labelStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const valueStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#f8fafc",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const archivedStyle: CSSProperties = {
  border: "1px solid rgba(245, 158, 11, 0.36)",
  background: "rgba(120, 53, 15, 0.22)",
  color: "#fde68a",
  padding: "14px",
  borderRadius: "16px",
  maxWidth: "1080px",
  marginBottom: "18px",
  fontWeight: 900,
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "1080px",
};

const emptyTextStyle: CSSProperties = {
  color: "#94a3b8",
  marginTop: 0,
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

function shortText(value: string | null, maxLength = 160) {
  if (!value) return null;

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function contactName(contact: {
  first_name: string;
  last_name: string | null;
}) {
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function isOpenOpportunity(opportunity: Opportunity) {
  return !["Customer", "Lost", "Paused"].includes(opportunity.stage);
}

function isCompletedTask(task: Task) {
  return task.status.toLowerCase() === "completed";
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: companyRow, error } = await supabase
    .from("companies")
    .select(
      "id, workspace_id, name, website, phone, email, lead_temperature, operating_regions, assets_equipment, created_at, updated_at, is_archived, archived_at, archived_by, archive_reason"
    )
    .eq("id", id)
    .single();

  const { data: contactRows } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, title, created_at")
    .eq("company_id", id)
    .eq("is_archived", false)
    .order("first_name", { ascending: true });

  const { data: taskRows } = await supabase
    .from("tasks")
    .select("id, title, status, priority, created_at")
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  const { data: activityRows } = await supabase
    .from("activities")
    .select("id, activity_type, activity_date, subject, outcome, follow_up_needed")
    .eq("company_id", id)
    .order("activity_date", { ascending: false });

  const { data: opportunityRows } = await supabase
    .from("opportunities")
    .select(`
      id,
      name,
      opportunity_type,
      stage,
      lead_temperature,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      created_at,
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("company_id", id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const { data: noteRows } = await supabase
    .from("notes")
    .select(`
      id,
      title,
      body,
      source,
      tags,
      created_at,
      contact:contacts!notes_contact_id_fkey (
        id,
        first_name,
        last_name
      ),
      opportunity:opportunities!notes_opportunity_id_fkey (
        id,
        name
      )
    `)
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  const { data: attachmentRows } = await supabase
    .from("attachments")
    .select("id, file_name, created_at")
    .eq("related_company_id", id)
    .order("created_at", { ascending: false });

  const { data: painPointRows } = await supabase
    .from("pain_point_companies")
    .select("id, pain_point_id, created_at, pain_points(id, name, category)")
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  const company = companyRow as unknown as Company | null;
  const contacts = (contactRows ?? []) as unknown as Contact[];
  const tasks = (taskRows ?? []) as unknown as Task[];
  const activities = (activityRows ?? []) as unknown as Activity[];
  const opportunities = (opportunityRows ?? []) as unknown as Opportunity[];
  const notes = (noteRows ?? []) as unknown as Note[];
  const attachments = (attachmentRows ?? []) as unknown as Attachment[];
  const painPointLinks = (painPointRows ?? []) as unknown as PainPointCompany[];

  const openOpportunities = opportunities.filter(isOpenOpportunity);
  const completedTasks = tasks.filter(isCompletedTask);
  const openTasks = tasks.filter((task) => !isCompletedTask(task));

  const relationshipItems: RelationshipSummaryItem[] = [
    {
      label: "Contacts",
      count: contacts.length,
      href: `/companies/${id}#related-contacts`,
    },
    {
      label: "Opportunities",
      count: opportunities.length,
      href: `/companies/${id}#related-opportunities`,
    },
    {
      label: "Open Opportunities",
      count: openOpportunities.length,
      href: `/companies/${id}#related-opportunities`,
    },
    {
      label: "Tasks",
      count: tasks.length,
      href: `/companies/${id}#related-tasks`,
    },
    {
      label: "Open Tasks",
      count: openTasks.length,
      href: `/companies/${id}#related-tasks`,
    },
    {
      label: "Completed Tasks",
      count: completedTasks.length,
      href: `/companies/${id}#related-tasks`,
    },
    {
      label: "Activities",
      count: activities.length,
      href: `/companies/${id}#related-activities`,
    },
    {
      label: "Notes",
      count: notes.length,
      href: `/companies/${id}#related-notes`,
    },
    {
      label: "Pain Points",
      count: painPointLinks.length,
      href: `/companies/${id}#related-pain-points`,
    },
    {
      label: "Attachments",
      count: attachments.length,
      href: `/companies/${id}#related-attachments`,
    },
  ];

  const timelineEvents: TimelineEvent[] = [
    ...(company
      ? [
          {
            id: `company-created-${company.id}`,
            title: `Company created: ${company.name}`,
            occurredAt: company.created_at,
            category: "Company",
            description: "This company record was created in Sell It.",
          },
        ]
      : []),

    ...contacts.map((contact) => ({
      id: `contact-added-${contact.id}`,
      title: `Contact added: ${contactName(contact)}`,
      occurredAt: contact.created_at,
      category: "Contact",
      href: `/contacts/${contact.id}`,
      meta: [
        contact.title ? `Title: ${contact.title}` : "No title",
        contact.email ? `Email: ${contact.email}` : "No email",
      ],
    })),

    ...opportunities.map((opportunity) => {
      const primaryContact = singleRelation(opportunity.primary_contact);

      return {
        id: `opportunity-created-${opportunity.id}`,
        title: `Opportunity created: ${opportunity.name}`,
        occurredAt: opportunity.created_at,
        category: "Opportunity",
        href: `/opportunities/${opportunity.id}`,
        meta: [
          `Stage: ${opportunity.stage}`,
          `Type: ${opportunity.opportunity_type}`,
          `Temperature: ${opportunity.lead_temperature}`,
          primaryContact ? `Primary Contact: ${contactName(primaryContact)}` : "",
        ].filter(Boolean),
      };
    }),

    ...tasks.map((task) => ({
      id: `task-created-${task.id}`,
      title: `Task created: ${task.title}`,
      occurredAt: task.created_at,
      category: "Task",
      href: `/tasks/${task.id}`,
      meta: [`Status: ${task.status}`, `Priority: ${task.priority}`],
    })),

    ...activities.map((activity) => ({
      id: `activity-${activity.id}`,
      title: `Activity: ${activity.subject}`,
      occurredAt: activity.activity_date,
      category: activity.activity_type,
      href: `/activities/${activity.id}`,
      description: activity.outcome ? `Outcome: ${activity.outcome}` : null,
      meta: activity.follow_up_needed ? ["Follow Up Needed"] : [],
    })),

    ...notes.map((note) => {
      const contact = singleRelation(note.contact);
      const opportunity = singleRelation(note.opportunity);

      return {
        id: `note-${note.id}`,
        title: `Note added: ${note.title}`,
        occurredAt: note.created_at,
        category: "Note",
        href: `/notes/${note.id}`,
        description: shortText(note.body),
        meta: [
          contact ? `Contact: ${contactName(contact)}` : "",
          opportunity ? `Opportunity: ${opportunity.name}` : "",
          note.source ? `Source: ${note.source}` : "",
          note.tags ? `Tags: ${note.tags}` : "",
        ].filter(Boolean),
      };
    }),

    ...attachments.map((attachment) => ({
      id: `attachment-${attachment.id}`,
      title: `Attachment uploaded: ${attachment.file_name || "Unnamed file"}`,
      occurredAt: attachment.created_at,
      category: "Attachment",
      description: "File attached to this company.",
    })),

    ...painPointLinks.map((painPointLink) => {
      const painPoint = singleRelation(painPointLink.pain_points);

      return {
        id: `pain-point-linked-${painPointLink.id}`,
        title: `Pain point linked: ${painPoint?.name || "Pain point"}`,
        occurredAt: painPointLink.created_at,
        category: "Pain Point",
        href: `/pain-points/${painPointLink.pain_point_id}`,
        meta: painPoint?.category ? [`Category: ${painPoint.category}`] : [],
      };
    }),
  ];

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href="/companies" style={secondaryButtonStyle}>
          Back to Companies
        </Link>

        {company && (
          <Link href={`/companies/${company.id}/edit`} style={secondaryButtonStyle}>
            Edit Company
          </Link>
        )}

        {company && (
          <ArchiveRestoreButton
            tableName="companies"
            recordId={company.id}
            isArchived={company.is_archived}
            returnPath={`/companies/${company.id}`}
          />
        )}

        {company && (
          <Link href={`/companies/${company.id}/delete`} style={dangerButtonStyle}>
            Delete Company
          </Link>
        )}
      </div>

      {error && <div style={errorStyle}>Database error: {error.message}</div>}

      {company && (
        <>
          {company.is_archived && <div style={archivedStyle}>ARCHIVED</div>}

          <header style={headerStyle}>
            <p style={eyebrowStyle}>Company Detail</p>

            <h1 style={titleStyle}>{company.name}</h1>

            <p style={mutedTextStyle}>
              Business-memory view for this company, including contacts,
              opportunities, tasks, activities, notes, attachments, pain points,
              timeline, and relationship summary.
            </p>
          </header>

          <section style={cardStyle}>
            <div style={gridStyle}>
              <div>
                <div style={labelStyle}>Website</div>
                <p style={valueStyle}>{company.website || "Not provided"}</p>
              </div>

              <div>
                <div style={labelStyle}>Phone</div>
                <p style={valueStyle}>{company.phone || "Not provided"}</p>
              </div>

              <div>
                <div style={labelStyle}>Email</div>
                <p style={valueStyle}>{company.email || "Not provided"}</p>
              </div>

              <div>
                <div style={labelStyle}>Lead Temperature</div>
                <p style={valueStyle}>
                  {company.lead_temperature || "Not provided"}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Operating Regions</div>
                <p style={valueStyle}>
                  {company.operating_regions || "Not provided"}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Assets / Equipment</div>
                <p style={valueStyle}>
                  {company.assets_equipment || "Not provided"}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Created</div>
                <p style={valueStyle}>{formatDateTime(company.created_at)}</p>
              </div>

              <div>
                <div style={labelStyle}>Last Updated</div>
                <p style={valueStyle}>{formatDateTime(company.updated_at)}</p>
              </div>

              {company.is_archived && (
                <>
                  <div>
                    <div style={labelStyle}>Archived</div>
                    <p style={valueStyle}>
                      {formatDateTime(company.archived_at)}
                    </p>
                  </div>

                  <div>
                    <div style={labelStyle}>Archive Reason</div>
                    <p style={valueStyle}>
                      {company.archive_reason || "Not provided"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          <RelationshipSummaryPanel
            title={`${company.name} Relationship Summary`}
            subtitle="Quick business-memory snapshot for this company."
            items={relationshipItems}
          />

          <RecordTimeline
            title="Company Timeline"
            subtitle="Newest first. Includes company history, contacts, opportunities, tasks, activities, notes, attachments, and pain point links."
            events={timelineEvents}
          />

          <section id="related-attachments" style={cardStyle}>
            <p style={eyebrowStyle}>Attachments</p>
            <AttachmentsSection
              workspaceId={company.workspace_id}
              relationColumn="related_company_id"
              relationId={company.id}
            />
          </section>

          <h2 id="related-opportunities" style={sectionTitleStyle}>
            Related Opportunities
          </h2>

          {opportunities.length === 0 && (
            <p style={emptyTextStyle}>No opportunities linked to this company.</p>
          )}

          {opportunities.map((opportunity) => {
            const primaryContact = singleRelation(opportunity.primary_contact);

            return (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                style={relatedCardStyle}
              >
                <h3 style={{ marginTop: 0 }}>{opportunity.name}</h3>

                <p>Type: {opportunity.opportunity_type}</p>
                <p>Stage: {opportunity.stage}</p>
                <p>Lead Temperature: {opportunity.lead_temperature}</p>

                {primaryContact && (
                  <p>
                    Primary Contact: {primaryContact.first_name}{" "}
                    {primaryContact.last_name || ""}
                  </p>
                )}

                {opportunity.estimated_monthly_value !== null && (
                  <p>
                    Estimated Monthly Value: $
                    {Number(opportunity.estimated_monthly_value).toLocaleString()}
                  </p>
                )}

                {opportunity.expected_close_date && (
                  <p>Expected Close Date: {opportunity.expected_close_date}</p>
                )}

                {opportunity.next_step && <p>Next Step: {opportunity.next_step}</p>}
              </Link>
            );
          })}

          <h2 id="related-notes" style={sectionTitleStyle}>
            Related Notes
          </h2>

          {notes.length === 0 && (
            <p style={emptyTextStyle}>No notes linked to this company.</p>
          )}

          {notes.map((note) => {
            const contact = singleRelation(note.contact);
            const opportunity = singleRelation(note.opportunity);

            return (
              <Link key={note.id} href={`/notes/${note.id}`} style={relatedCardStyle}>
                <h3 style={{ marginTop: 0 }}>{note.title}</h3>

                {note.body && <p style={{ color: "#cbd5e1" }}>{shortText(note.body)}</p>}

                {contact && (
                  <p>
                    Contact: {contact.first_name} {contact.last_name || ""}
                  </p>
                )}

                {opportunity && <p>Opportunity: {opportunity.name}</p>}

                {note.source && <p>Source: {note.source}</p>}
                {note.tags && <p>Tags: {note.tags}</p>}

                {note.created_at && (
                  <p>Created: {formatDateTime(note.created_at)}</p>
                )}
              </Link>
            );
          })}

          <h2 id="related-contacts" style={sectionTitleStyle}>
            Related Contacts
          </h2>

          {contacts.length === 0 && (
            <p style={emptyTextStyle}>No contacts linked to this company.</p>
          )}

          {contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              style={relatedCardStyle}
            >
              <h3 style={{ marginTop: 0 }}>
                {contact.first_name} {contact.last_name || ""}
              </h3>

              {contact.title && <p>Title: {contact.title}</p>}
              {contact.email && <p>Email: {contact.email}</p>}
              {contact.phone && <p>Phone: {contact.phone}</p>}
            </Link>
          ))}

          <h2 id="related-tasks" style={sectionTitleStyle}>
            Related Tasks
          </h2>

          {tasks.length === 0 && (
            <p style={emptyTextStyle}>No tasks linked to this company.</p>
          )}

          {tasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} style={relatedCardStyle}>
              <h3 style={{ marginTop: 0 }}>{task.title}</h3>
              <p>Status: {task.status}</p>
              <p>Priority: {task.priority}</p>
            </Link>
          ))}

          <h2 id="related-activities" style={sectionTitleStyle}>
            Related Activities
          </h2>

          {activities.length === 0 && (
            <p style={emptyTextStyle}>No activities linked to this company.</p>
          )}

          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/activities/${activity.id}`}
              style={relatedCardStyle}
            >
              <h3 style={{ marginTop: 0 }}>{activity.subject}</h3>

              <p>Type: {activity.activity_type}</p>
              <p>Date: {formatDateTime(activity.activity_date)}</p>

              {activity.outcome && <p>Outcome: {activity.outcome}</p>}

              {activity.follow_up_needed && (
                <p style={{ fontWeight: 900, color: "#ddd6fe" }}>
                  Follow Up Needed
                </p>
              )}
            </Link>
          ))}

          <h2 id="related-pain-points" style={sectionTitleStyle}>
            Related Pain Points
          </h2>

          {painPointLinks.length === 0 && (
            <p style={emptyTextStyle}>No pain points linked to this company.</p>
          )}

          {painPointLinks.map((painPointLink) => {
            const painPoint = singleRelation(painPointLink.pain_points);

            return (
              <Link
                key={painPointLink.id}
                href={`/pain-points/${painPointLink.pain_point_id}`}
                style={relatedCardStyle}
              >
                <h3 style={{ marginTop: 0 }}>{painPoint?.name || "Pain Point"}</h3>

                {painPoint?.category && <p>Category: {painPoint.category}</p>}

                <p>Linked: {formatDateTime(painPointLink.created_at)}</p>
              </Link>
            );
          })}
        </>
      )}
    </main>
  );
}