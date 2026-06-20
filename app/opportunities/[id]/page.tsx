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

type RelatedCompany = {
  id: string;
  name: string;
};

type RelatedContact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type Opportunity = {
  id: string;
  workspace_id: string;
  name: string;
  opportunity_type: string;
  opportunity_type_other_description: string | null;
  stage: string;
  lead_temperature: string;
  estimated_driver_count: number | null;
  estimated_monthly_value: number | null;
  expected_close_date: string | null;
  next_step: string | null;
  notes: string | null;
  company_id: string;
  primary_contact_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  archive_reason: string | null;
  companies: SupabaseRelation<RelatedCompany>;
  primary_contact: SupabaseRelation<RelatedContact>;
};

type Note = {
  id: string;
  title: string;
  body: string | null;
  source: string | null;
  tags: string | null;
  created_at: string | null;
  company: SupabaseRelation<RelatedCompany>;
  contact: SupabaseRelation<RelatedContact>;
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

type PainPointActivity = {
  id: string;
  pain_point_id: string;
  activity_id: string;
  created_at: string | null;
  pain_points: SupabaseRelation<PainPoint>;
};

type StageHistory = {
  id: string;
  old_stage: string | null;
  new_stage: string;
  changed_by: string | null;
  changed_at: string | null;
  notes: string | null;
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

const plainRelatedCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "12px",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#f8fafc",
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

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  textDecoration: "none",
  fontWeight: 800,
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

function isCompletedTask(task: Task) {
  return task.status.toLowerCase() === "completed";
}

function isDifferentDate(first: string | null, second: string | null) {
  if (!first || !second) return false;
  return Date.parse(first) !== Date.parse(second);
}

function compactStrings(items: Array<string | null | undefined | false>) {
  return items.filter((item): item is string => Boolean(item));
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: opportunityRow, error } = await supabase
    .from("opportunities")
    .select(`
      id,
      workspace_id,
      name,
      opportunity_type,
      opportunity_type_other_description,
      stage,
      lead_temperature,
      estimated_driver_count,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      notes,
      company_id,
      primary_contact_id,
      created_at,
      updated_at,
      is_archived,
      archived_at,
      archived_by,
      archive_reason,
      companies (
        id,
        name
      ),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("id", id)
    .single();

  const { data: noteRows } = await supabase
    .from("notes")
    .select(`
      id,
      title,
      body,
      source,
      tags,
      created_at,
      company:companies!notes_company_id_fkey (
        id,
        name
      ),
      contact:contacts!notes_contact_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  const { data: taskRows } = await supabase
    .from("tasks")
    .select("id, title, status, priority, created_at")
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  const { data: activityRows } = await supabase
    .from("activities")
    .select("id, activity_type, activity_date, subject, outcome, follow_up_needed")
    .eq("opportunity_id", id)
    .order("activity_date", { ascending: false });

  const { data: attachmentRows } = await supabase
    .from("attachments")
    .select("id, file_name, created_at")
    .eq("related_opportunity_id", id)
    .order("created_at", { ascending: false });

  const { data: stageHistoryRows } = await supabase
    .from("opportunity_stage_history")
    .select("id, old_stage, new_stage, changed_by, changed_at, notes")
    .eq("opportunity_id", id)
    .order("changed_at", { ascending: false });

  const opportunity = opportunityRow as unknown as Opportunity | null;
  const relatedNotes = (noteRows ?? []) as unknown as Note[];
  const relatedTasks = (taskRows ?? []) as unknown as Task[];
  const relatedActivities = (activityRows ?? []) as unknown as Activity[];
  const attachments = (attachmentRows ?? []) as unknown as Attachment[];
  const stageHistory = (stageHistoryRows ?? []) as unknown as StageHistory[];

  const activityIds = relatedActivities.map((activity) => activity.id);

  let painPointLinks: PainPointActivity[] = [];

  if (activityIds.length > 0) {
    const { data: painPointRows } = await supabase
      .from("pain_point_activities")
      .select("id, pain_point_id, activity_id, created_at, pain_points(id, name, category)")
      .in("activity_id", activityIds)
      .order("created_at", { ascending: false });

    painPointLinks = (painPointRows ?? []) as unknown as PainPointActivity[];
  }

  const company = singleRelation(opportunity?.companies);
  const primaryContact = singleRelation(opportunity?.primary_contact);

  const completedTasks = relatedTasks.filter(isCompletedTask);
  const openTasks = relatedTasks.filter((task) => !isCompletedTask(task));
  const lastStageChange = stageHistory[0] ?? null;

  const relationshipItems: RelationshipSummaryItem[] = [
    {
      label: "Company",
      count: company ? 1 : 0,
      href: company ? `/companies/${company.id}` : undefined,
      description: company?.name,
    },
    {
      label: "Primary Contact",
      count: primaryContact ? 1 : 0,
      href: primaryContact ? `/contacts/${primaryContact.id}` : undefined,
      description: primaryContact ? contactName(primaryContact) : undefined,
    },
    {
      label: "Stage Changes",
      count: stageHistory.length,
      href: `/opportunities/${id}#stage-history`,
      description: lastStageChange
        ? `Last: ${lastStageChange.old_stage || "None"} to ${lastStageChange.new_stage}`
        : "No stage changes yet",
    },
    {
      label: "Tasks",
      count: relatedTasks.length,
      href: `/opportunities/${id}#related-tasks`,
    },
    {
      label: "Open Tasks",
      count: openTasks.length,
      href: `/opportunities/${id}#related-tasks`,
    },
    {
      label: "Completed Tasks",
      count: completedTasks.length,
      href: `/opportunities/${id}#related-tasks`,
    },
    {
      label: "Activities",
      count: relatedActivities.length,
      href: `/opportunities/${id}#related-activities`,
    },
    {
      label: "Notes",
      count: relatedNotes.length,
      href: `/opportunities/${id}#related-notes`,
    },
    {
      label: "Pain Points",
      count: painPointLinks.length,
      href: `/opportunities/${id}#related-pain-points`,
      description: "From linked activities",
    },
    {
      label: "Attachments",
      count: attachments.length,
      href: `/opportunities/${id}#related-attachments`,
    },
  ];

  const timelineEvents: TimelineEvent[] = [
    ...(opportunity
      ? [
          {
            id: `opportunity-created-${opportunity.id}`,
            title: `Opportunity created: ${opportunity.name}`,
            occurredAt: opportunity.created_at,
            category: "Opportunity",
            description:
              opportunity.notes || "This opportunity record was created in Sell It.",
            meta: compactStrings([
              company ? `Company: ${company.name}` : "No company",
              primaryContact
                ? `Primary Contact: ${contactName(primaryContact)}`
                : "No primary contact",
              `Stage: ${opportunity.stage}`,
              `Type: ${opportunity.opportunity_type}`,
              `Temperature: ${opportunity.lead_temperature}`,
            ]),
          },
        ]
      : []),

    ...stageHistory.map((history) => ({
      id: `stage-history-${history.id}`,
      title: `Stage changed: ${history.old_stage || "None"} to ${history.new_stage}`,
      occurredAt: history.changed_at,
      category: "Stage Change",
      description: history.notes || null,
      meta: compactStrings([
        history.changed_by ? `Changed by: ${history.changed_by}` : null,
      ]),
    })),

    ...(opportunity &&
    isDifferentDate(opportunity.created_at, opportunity.updated_at)
      ? [
          {
            id: `opportunity-updated-${opportunity.id}`,
            title: `Opportunity updated: ${opportunity.name}`,
            occurredAt: opportunity.updated_at,
            category: "Opportunity",
            description:
              "Opportunity was updated. Current stage is shown below.",
            meta: compactStrings([
              `Current Stage: ${opportunity.stage}`,
              opportunity.next_step
                ? `Next Step: ${shortText(opportunity.next_step, 80)}`
                : null,
            ]),
          },
        ]
      : []),

    ...relatedTasks.map((task) => ({
      id: `task-created-${task.id}`,
      title: `Task created: ${task.title}`,
      occurredAt: task.created_at,
      category: "Task",
      href: `/tasks/${task.id}`,
      meta: [`Status: ${task.status}`, `Priority: ${task.priority}`],
    })),

    ...relatedActivities.map((activity) => ({
      id: `activity-${activity.id}`,
      title: `Activity: ${activity.subject}`,
      occurredAt: activity.activity_date,
      category: activity.activity_type,
      href: `/activities/${activity.id}`,
      description: activity.outcome ? `Outcome: ${activity.outcome}` : null,
      meta: activity.follow_up_needed ? ["Follow Up Needed"] : [],
    })),

    ...relatedNotes.map((note) => {
      const noteCompany = singleRelation(note.company);
      const noteContact = singleRelation(note.contact);

      return {
        id: `note-${note.id}`,
        title: `Note added: ${note.title}`,
        occurredAt: note.created_at,
        category: "Note",
        href: `/notes/${note.id}`,
        description: shortText(note.body),
        meta: compactStrings([
          noteCompany ? `Company: ${noteCompany.name}` : null,
          noteContact ? `Contact: ${contactName(noteContact)}` : null,
          note.source ? `Source: ${note.source}` : null,
          note.tags ? `Tags: ${note.tags}` : null,
        ]),
      };
    }),

    ...attachments.map((attachment) => ({
      id: `attachment-${attachment.id}`,
      title: `Attachment uploaded: ${attachment.file_name || "Unnamed file"}`,
      occurredAt: attachment.created_at,
      category: "Attachment",
      description: "File attached to this opportunity.",
    })),

    ...painPointLinks.map((painPointLink) => {
      const painPoint = singleRelation(painPointLink.pain_points);
      const linkedActivity = relatedActivities.find(
        (activity) => activity.id === painPointLink.activity_id
      );

      return {
        id: `pain-point-linked-${painPointLink.id}`,
        title: `Pain point linked: ${painPoint?.name || "Pain point"}`,
        occurredAt: painPointLink.created_at,
        category: "Pain Point",
        href: `/pain-points/${painPointLink.pain_point_id}`,
        meta: compactStrings([
          painPoint?.category ? `Category: ${painPoint.category}` : null,
          linkedActivity ? `Activity: ${linkedActivity.subject}` : null,
        ]),
      };
    }),
  ];

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href="/opportunities" style={secondaryButtonStyle}>
          Back to Opportunities
        </Link>

        {opportunity && (
          <Link
            href={`/opportunities/${opportunity.id}/edit`}
            style={secondaryButtonStyle}
          >
            Edit Opportunity
          </Link>
        )}

        {opportunity && (
          <ArchiveRestoreButton
            tableName="opportunities"
            recordId={opportunity.id}
            isArchived={opportunity.is_archived}
            returnPath={`/opportunities/${opportunity.id}`}
          />
        )}

        {opportunity && (
          <Link
            href={`/opportunities/${opportunity.id}/delete`}
            style={dangerButtonStyle}
          >
            Delete Opportunity
          </Link>
        )}
      </div>

      {error && (
        <div style={errorStyle}>Database error: {error.message}</div>
      )}

      {opportunity && (
        <>
          {opportunity.is_archived && <div style={archivedStyle}>ARCHIVED</div>}

          <header style={headerStyle}>
            <p style={eyebrowStyle}>Opportunity Detail</p>

            <h1 style={titleStyle}>{opportunity.name}</h1>

            <p style={mutedTextStyle}>
              Business-memory view for this opportunity, including company,
              primary contact, stage history, tasks, activities, notes,
              attachments, pain points, timeline, and relationship summary.
            </p>
          </header>

          <section style={cardStyle}>
            <div style={gridStyle}>
              <div>
                <div style={labelStyle}>Company</div>
                <p style={valueStyle}>
                  {company ? (
                    <Link href={`/companies/${company.id}`} style={linkStyle}>
                      {company.name}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Primary Contact</div>
                <p style={valueStyle}>
                  {primaryContact ? (
                    <Link
                      href={`/contacts/${primaryContact.id}`}
                      style={linkStyle}
                    >
                      {primaryContact.first_name} {primaryContact.last_name || ""}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Opportunity Type</div>
                <p style={valueStyle}>{opportunity.opportunity_type}</p>
              </div>

              <div>
                <div style={labelStyle}>Stage</div>
                <p style={valueStyle}>{opportunity.stage}</p>
              </div>

              <div>
                <div style={labelStyle}>Lead Temperature</div>
                <p style={valueStyle}>{opportunity.lead_temperature}</p>
              </div>

              <div>
                <div style={labelStyle}>Estimated Driver Count</div>
                <p style={valueStyle}>
                  {opportunity.estimated_driver_count !== null
                    ? opportunity.estimated_driver_count
                    : "Not provided"}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Estimated Monthly Value</div>
                <p style={valueStyle}>
                  {opportunity.estimated_monthly_value !== null
                    ? `$${Number(
                        opportunity.estimated_monthly_value
                      ).toLocaleString()}`
                    : "Not provided"}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Expected Close Date</div>
                <p style={valueStyle}>
                  {opportunity.expected_close_date || "Not provided"}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Created</div>
                <p style={valueStyle}>
                  {formatDateTime(opportunity.created_at)}
                </p>
              </div>

              <div>
                <div style={labelStyle}>Last Updated</div>
                <p style={valueStyle}>
                  {formatDateTime(opportunity.updated_at)}
                </p>
              </div>

              {opportunity.is_archived && (
                <>
                  <div>
                    <div style={labelStyle}>Archived</div>
                    <p style={valueStyle}>
                      {formatDateTime(opportunity.archived_at)}
                    </p>
                  </div>

                  <div>
                    <div style={labelStyle}>Archive Reason</div>
                    <p style={valueStyle}>
                      {opportunity.archive_reason || "Not provided"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {opportunity.opportunity_type === "Other" && (
              <div style={{ marginTop: "22px" }}>
                <div style={labelStyle}>Other Type Description</div>
                <p
                  style={{
                    ...valueStyle,
                    color: "#cbd5e1",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {opportunity.opportunity_type_other_description ||
                    "No other type description provided."}
                </p>
              </div>
            )}

            <div style={{ marginTop: "22px" }}>
              <div style={labelStyle}>Next Step</div>
              <p
                style={{
                  ...valueStyle,
                  color: "#cbd5e1",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                }}
              >
                {opportunity.next_step || "No next step provided."}
              </p>
            </div>

            <div style={{ marginTop: "22px" }}>
              <div style={labelStyle}>Notes</div>
              <p
                style={{
                  ...valueStyle,
                  color: "#cbd5e1",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                }}
              >
                {opportunity.notes || "No notes provided."}
              </p>
            </div>
          </section>

          <RelationshipSummaryPanel
            title={`${opportunity.name} Relationship Summary`}
            subtitle="Quick business-memory snapshot for this opportunity."
            items={relationshipItems}
          />

          <RecordTimeline
            title="Opportunity Timeline"
            subtitle="Newest first. Includes opportunity history, stage changes, tasks, activities, notes, attachments, and pain points linked through activities."
            events={timelineEvents}
          />

          <h2 id="stage-history" style={sectionTitleStyle}>
            Stage History
          </h2>

          {stageHistory.length === 0 && (
            <p style={emptyTextStyle}>No stage changes recorded yet.</p>
          )}

          {stageHistory.map((history) => (
            <article key={history.id} style={plainRelatedCardStyle}>
              <h3 style={{ marginTop: 0 }}>
                {history.old_stage || "None"} to {history.new_stage}
              </h3>

              <p>
                <strong>Changed:</strong> {formatDateTime(history.changed_at)}
              </p>

              {history.changed_by && (
                <p>
                  <strong>Changed By:</strong> {history.changed_by}
                </p>
              )}

              {history.notes && (
                <p style={{ whiteSpace: "pre-wrap" }}>
                  <strong>Notes:</strong> {history.notes}
                </p>
              )}
            </article>
          ))}

          <section id="related-attachments" style={cardStyle}>
            <p style={eyebrowStyle}>Attachments</p>
            <AttachmentsSection
              workspaceId={opportunity.workspace_id}
              relationColumn="related_opportunity_id"
              relationId={opportunity.id}
            />
          </section>

          <h2 id="related-tasks" style={sectionTitleStyle}>
            Related Tasks
          </h2>

          {relatedTasks.length === 0 && (
            <p style={emptyTextStyle}>No tasks linked to this opportunity.</p>
          )}

          {relatedTasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} style={relatedCardStyle}>
              <h3 style={{ marginTop: 0 }}>{task.title}</h3>
              <p>Status: {task.status}</p>
              <p>Priority: {task.priority}</p>
            </Link>
          ))}

          <h2 id="related-activities" style={sectionTitleStyle}>
            Related Activities
          </h2>

          {relatedActivities.length === 0 && (
            <p style={emptyTextStyle}>No activities linked to this opportunity.</p>
          )}

          {relatedActivities.map((activity) => (
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

          <h2 id="related-notes" style={sectionTitleStyle}>
            Related Notes
          </h2>

          {relatedNotes.length === 0 && (
            <p style={emptyTextStyle}>No notes linked to this opportunity.</p>
          )}

          {relatedNotes.map((note) => {
            const noteCompany = singleRelation(note.company);
            const noteContact = singleRelation(note.contact);

            return (
              <Link key={note.id} href={`/notes/${note.id}`} style={relatedCardStyle}>
                <h3 style={{ marginTop: 0 }}>{note.title}</h3>

                {note.body && <p style={{ color: "#cbd5e1" }}>{shortText(note.body)}</p>}

                {noteCompany && <p>Company: {noteCompany.name}</p>}

                {noteContact && (
                  <p>
                    Contact: {noteContact.first_name}{" "}
                    {noteContact.last_name || ""}
                  </p>
                )}

                {note.source && <p>Source: {note.source}</p>}
                {note.tags && <p>Tags: {note.tags}</p>}

                {note.created_at && (
                  <p>Created: {formatDateTime(note.created_at)}</p>
                )}
              </Link>
            );
          })}

          <h2 id="related-pain-points" style={sectionTitleStyle}>
            Related Pain Points
          </h2>

          {painPointLinks.length === 0 && (
            <p style={emptyTextStyle}>
              No pain points linked through this opportunity&apos;s activities.
            </p>
          )}

          {painPointLinks.map((painPointLink) => {
            const painPoint = singleRelation(painPointLink.pain_points);
            const linkedActivity = relatedActivities.find(
              (activity) => activity.id === painPointLink.activity_id
            );

            return (
              <Link
                key={painPointLink.id}
                href={`/pain-points/${painPointLink.pain_point_id}`}
                style={relatedCardStyle}
              >
                <h3 style={{ marginTop: 0 }}>{painPoint?.name || "Pain Point"}</h3>

                {painPoint?.category && <p>Category: {painPoint.category}</p>}

                {linkedActivity && <p>Activity: {linkedActivity.subject}</p>}

                <p>Linked: {formatDateTime(painPointLink.created_at)}</p>
              </Link>
            );
          })}
        </>
      )}
    </main>
  );
}