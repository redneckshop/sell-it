import Link from "next/link";
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
            description: opportunity.notes || "This opportunity record was created in Sell It.",
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
        <Link
          href="/"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Home
        </Link>

        <Link
          href="/opportunities"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Opportunities
        </Link>

        {opportunity && (
          <Link
            href={`/opportunities/${opportunity.id}/edit`}
            style={{
              color: "black",
              backgroundColor: "white",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
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
            style={{
              color: "black",
              backgroundColor: "#ffdddd",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Delete Opportunity
          </Link>
        )}
      </div>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {opportunity && (
        <section style={{ marginTop: "32px" }}>
          {opportunity.is_archived && (
            <div
              style={{
                border: "1px solid #d6a400",
                backgroundColor: "#211c0d",
                color: "#f5d76e",
                padding: "16px",
                borderRadius: "8px",
                maxWidth: "650px",
                marginBottom: "24px",
                fontWeight: "bold",
              }}
            >
              ARCHIVED
            </div>
          )}

          <h1>{opportunity.name}</h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "800px",
              marginBottom: "28px",
            }}
          >
            <p>
              <strong>Company:</strong>{" "}
              {company ? (
                <Link
                  href={`/companies/${company.id}`}
                  style={{ color: "white" }}
                >
                  {company.name}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Primary Contact:</strong>{" "}
              {primaryContact ? (
                <Link
                  href={`/contacts/${primaryContact.id}`}
                  style={{ color: "white" }}
                >
                  {primaryContact.first_name} {primaryContact.last_name || ""}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Opportunity Type:</strong>{" "}
              {opportunity.opportunity_type}
            </p>

            {opportunity.opportunity_type === "Other" && (
              <>
                <p>
                  <strong>Other Type Description:</strong>
                </p>

                <p style={{ whiteSpace: "pre-wrap" }}>
                  {opportunity.opportunity_type_other_description ||
                    "No other type description provided."}
                </p>
              </>
            )}

            <p>
              <strong>Stage:</strong> {opportunity.stage}
            </p>

            <p>
              <strong>Lead Temperature:</strong>{" "}
              {opportunity.lead_temperature}
            </p>

            <p>
              <strong>Estimated Driver Count:</strong>{" "}
              {opportunity.estimated_driver_count !== null
                ? opportunity.estimated_driver_count
                : "Not provided"}
            </p>

            <p>
              <strong>Estimated Monthly Value:</strong>{" "}
              {opportunity.estimated_monthly_value !== null
                ? `$${Number(
                    opportunity.estimated_monthly_value
                  ).toLocaleString()}`
                : "Not provided"}
            </p>

            <p>
              <strong>Expected Close Date:</strong>{" "}
              {opportunity.expected_close_date || "Not provided"}
            </p>

            <p>
              <strong>Next Step:</strong>
            </p>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {opportunity.next_step || "No next step provided."}
            </p>

            <p>
              <strong>Notes:</strong>
            </p>

            <p style={{ whiteSpace: "pre-wrap" }}>
              {opportunity.notes || "No notes provided."}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {formatDateTime(opportunity.created_at)}
            </p>

            <p>
              <strong>Last Updated:</strong>{" "}
              {formatDateTime(opportunity.updated_at)}
            </p>

            {opportunity.is_archived && (
              <>
                <p>
                  <strong>Archived:</strong>{" "}
                  {formatDateTime(opportunity.archived_at)}
                </p>

                <p>
                  <strong>Archive Reason:</strong>{" "}
                  {opportunity.archive_reason || "Not provided"}
                </p>
              </>
            )}
          </div>

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

          <h2 id="stage-history" style={{ marginTop: "40px" }}>
            Stage History
          </h2>

          {stageHistory.length === 0 && (
            <p>No stage changes recorded yet.</p>
          )}

          {stageHistory.map((history) => (
            <article
              key={history.id}
              style={{
                display: "block",
                border: "1px solid #333",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
                color: "white",
                maxWidth: "750px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {history.old_stage || "None"} to {history.new_stage}
              </h3>

              <p>
                <strong>Changed:</strong>{" "}
                {formatDateTime(history.changed_at)}
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

          <div id="related-attachments">
            <AttachmentsSection
              workspaceId={opportunity.workspace_id}
              relationColumn="related_opportunity_id"
              relationId={opportunity.id}
            />
          </div>

          <h2 id="related-tasks" style={{ marginTop: "40px" }}>
            Related Tasks
          </h2>

          {relatedTasks.length === 0 && (
            <p>No tasks linked to this opportunity.</p>
          )}

          {relatedTasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              style={{
                display: "block",
                border: "1px solid #333",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
                color: "white",
                textDecoration: "none",
                maxWidth: "750px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{task.title}</h3>
              <p>Status: {task.status}</p>
              <p>Priority: {task.priority}</p>
            </Link>
          ))}

          <h2 id="related-activities" style={{ marginTop: "40px" }}>
            Related Activities
          </h2>

          {relatedActivities.length === 0 && (
            <p>No activities linked to this opportunity.</p>
          )}

          {relatedActivities.map((activity) => (
            <Link
              key={activity.id}
              href={`/activities/${activity.id}`}
              style={{
                display: "block",
                border: "1px solid #333",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "8px",
                backgroundColor: "#1a1a1a",
                color: "white",
                textDecoration: "none",
                maxWidth: "750px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{activity.subject}</h3>

              <p>Type: {activity.activity_type}</p>

              <p>Date: {formatDateTime(activity.activity_date)}</p>

              {activity.outcome && <p>Outcome: {activity.outcome}</p>}

              {activity.follow_up_needed && (
                <p style={{ fontWeight: "bold" }}>Follow Up Needed</p>
              )}
            </Link>
          ))}

          <h2 id="related-notes" style={{ marginTop: "40px" }}>
            Related Notes
          </h2>

          {relatedNotes.length === 0 && (
            <p>No notes linked to this opportunity.</p>
          )}

          {relatedNotes.map((note) => {
            const noteCompany = singleRelation(note.company);
            const noteContact = singleRelation(note.contact);

            return (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                style={{
                  display: "block",
                  border: "1px solid #333",
                  padding: "16px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  backgroundColor: "#1a1a1a",
                  color: "white",
                  textDecoration: "none",
                  maxWidth: "750px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{note.title}</h3>

                {note.body && (
                  <p style={{ color: "#aaa" }}>
                    {note.body.length > 160
                      ? `${note.body.slice(0, 160)}...`
                      : note.body}
                  </p>
                )}

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

          <h2 id="related-pain-points" style={{ marginTop: "40px" }}>
            Related Pain Points
          </h2>

          {painPointLinks.length === 0 && (
            <p>
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
                style={{
                  display: "block",
                  border: "1px solid #333",
                  padding: "16px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  backgroundColor: "#1a1a1a",
                  color: "white",
                  textDecoration: "none",
                  maxWidth: "750px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  {painPoint?.name || "Pain Point"}
                </h3>

                {painPoint?.category && <p>Category: {painPoint.category}</p>}

                {linkedActivity && <p>Activity: {linkedActivity.subject}</p>}

                <p>Linked: {formatDateTime(painPointLink.created_at)}</p>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}

