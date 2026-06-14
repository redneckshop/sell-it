import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";

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
  created_at: string | null;
  companies: SupabaseRelation<RelatedCompany>;
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
  companies: SupabaseRelation<RelatedCompany>;
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
  company: SupabaseRelation<RelatedCompany>;
  opportunity: SupabaseRelation<NoteOpportunity>;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

type Activity = {
  id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  outcome: string | null;
  follow_up_needed: boolean;
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

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: contactRow, error } = await supabase
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
      created_at,
      companies (
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

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
      companies (
        id,
        name
      )
    `)
    .eq("primary_contact_id", id)
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
      company:companies!notes_company_id_fkey (
        id,
        name
      ),
      opportunity:opportunities!notes_opportunity_id_fkey (
        id,
        name
      )
    `)
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  const { data: taskRows } = await supabase
    .from("tasks")
    .select("id, title, status, priority")
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  const { data: activityRows } = await supabase
    .from("activities")
    .select("id, activity_type, activity_date, subject, outcome, follow_up_needed")
    .eq("contact_id", id)
    .order("activity_date", { ascending: false });

  const contact = contactRow as unknown as Contact | null;
  const opportunities = (opportunityRows ?? []) as unknown as Opportunity[];
  const notes = (noteRows ?? []) as unknown as Note[];
  const tasks = (taskRows ?? []) as unknown as Task[];
  const activities = (activityRows ?? []) as unknown as Activity[];

  const company = singleRelation(contact?.companies);

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
          href="/contacts"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Contacts
        </Link>
        {contact && (
          <Link
            href={`/contacts/${contact.id}/delete`}
            style={{
              color: "black",
              backgroundColor: "#ffdddd",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Delete Contact
          </Link>
        )}
      </div>

      {error && <p style={{ color: "red" }}>Database error: {error.message}</p>}

      {contact && (
        <>
          <h1>
            {contact.first_name} {contact.last_name || ""}
          </h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "650px",
              marginBottom: "40px",
            }}
          >
            <p>
              <strong>Title:</strong> {contact.title || "Not provided"}
            </p>

            <p>
              <strong>Email:</strong> {contact.email || "Not provided"}
            </p>

            <p>
              <strong>Phone:</strong> {contact.phone || "Not provided"}
            </p>

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
              <strong>Contact Notes:</strong>{" "}
              {contact.notes || "Not provided"}
            </p>

            <p>
              <strong>Created:</strong> {formatDateTime(contact.created_at)}
            </p>
          </div>

          <AttachmentsSection
            workspaceId={contact.workspace_id}
            relationColumn="related_contact_id"
            relationId={contact.id}
          />

          <h2 style={{ marginTop: "40px" }}>Related Opportunities</h2>

          {opportunities.length === 0 && (
            <p>No opportunities linked to this contact.</p>
          )}

          {opportunities.map((opportunity) => {
            const opportunityCompany = singleRelation(opportunity.companies);

            return (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
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
                <h3 style={{ marginTop: 0 }}>{opportunity.name}</h3>

                <p>Company: {opportunityCompany?.name || "Not linked"}</p>
                <p>Type: {opportunity.opportunity_type}</p>
                <p>Stage: {opportunity.stage}</p>
                <p>Lead Temperature: {opportunity.lead_temperature}</p>

                {opportunity.estimated_monthly_value !== null && (
                  <p>
                    Estimated Monthly Value: $
                    {Number(
                      opportunity.estimated_monthly_value
                    ).toLocaleString()}
                  </p>
                )}

                {opportunity.expected_close_date && (
                  <p>Expected Close Date: {opportunity.expected_close_date}</p>
                )}

                {opportunity.next_step && (
                  <p>Next Step: {opportunity.next_step}</p>
                )}
              </Link>
            );
          })}

          <h2 style={{ marginTop: "40px" }}>Related Notes</h2>

          {notes.length === 0 && <p>No notes linked to this contact.</p>}

          {notes.map((note) => {
            const noteCompany = singleRelation(note.company);
            const noteOpportunity = singleRelation(note.opportunity);

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

                {noteOpportunity && (
                  <p>Opportunity: {noteOpportunity.name}</p>
                )}

                {note.source && <p>Source: {note.source}</p>}
                {note.tags && <p>Tags: {note.tags}</p>}

                {note.created_at && (
                  <p>Created: {formatDateTime(note.created_at)}</p>
                )}
              </Link>
            );
          })}

          <h2 style={{ marginTop: "40px" }}>Related Tasks</h2>

          {tasks.length === 0 && <p>No tasks linked to this contact.</p>}

          {tasks.map((task) => (
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

          <h2 style={{ marginTop: "40px" }}>Related Activities</h2>

          {activities.length === 0 && (
            <p>No activities linked to this contact.</p>
          )}

          {activities.map((activity) => (
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
        </>
      )}
    </main>
  );
}