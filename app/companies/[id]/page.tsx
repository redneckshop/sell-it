import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";

type Company = {
  id: string;
  workspace_id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  operating_regions: string | null;
  assets_equipment: string | null;
  created_at: string | null;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
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

type Opportunity = {
  id: string;
  name: string;
  opportunity_type: string;
  stage: string;
  lead_temperature: string;
  estimated_monthly_value: number | null;
  expected_close_date: string | null;
  next_step: string | null;
  primary_contact: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
};

type Note = {
  id: string;
  title: string;
  body: string | null;
  source: string | null;
  tags: string | null;
  created_at: string | null;
  contact: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
  opportunity: {
    id: string;
    name: string;
  } | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: company, error } = await supabase
    .from("companies")
    .select(
      "id, workspace_id, name, website, phone, email, operating_regions, assets_equipment, created_at"
    )
    .eq("id", id)
    .single();

  const { data: contactRows } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, title")
    .eq("company_id", id)
    .order("first_name", { ascending: true });

  const { data: taskRows } = await supabase
    .from("tasks")
    .select("id, title, status, priority")
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
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("company_id", id)
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

  const contacts: Contact[] = contactRows ?? [];
  const tasks: Task[] = taskRows ?? [];
  const activities: Activity[] = activityRows ?? [];
  const opportunities: Opportunity[] = opportunityRows ?? [];
  const notes: Note[] = noteRows ?? [];

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
          href="/companies"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Companies
        </Link>
      </div>

      {error && <p style={{ color: "red" }}>Database error: {error.message}</p>}

      {company && (
        <>
          <h1>{company.name}</h1>

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
              <strong>Website:</strong> {company.website || "Not provided"}
            </p>

            <p>
              <strong>Phone:</strong> {company.phone || "Not provided"}
            </p>

            <p>
              <strong>Email:</strong> {company.email || "Not provided"}
            </p>

            <p>
              <strong>Operating Regions:</strong>{" "}
              {company.operating_regions || "Not provided"}
            </p>

            <p>
              <strong>Assets / Equipment:</strong>{" "}
              {company.assets_equipment || "Not provided"}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {company.created_at
                ? new Date(company.created_at).toLocaleString()
                : "Not available"}
            </p>
          </div>

          <AttachmentsSection
            workspaceId={company.workspace_id}
            relationColumn="related_company_id"
            relationId={company.id}
          />

          <h2 style={{ marginTop: "40px" }}>Related Opportunities</h2>

          {opportunities.length === 0 && (
            <p>No opportunities linked to this company.</p>
          )}

          {opportunities.map((opportunity) => (
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

              <p>Type: {opportunity.opportunity_type}</p>
              <p>Stage: {opportunity.stage}</p>
              <p>Lead Temperature: {opportunity.lead_temperature}</p>

              {opportunity.primary_contact && (
                <p>
                  Primary Contact: {opportunity.primary_contact.first_name}{" "}
                  {opportunity.primary_contact.last_name || ""}
                </p>
              )}

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

              {opportunity.next_step && <p>Next Step: {opportunity.next_step}</p>}
            </Link>
          ))}

          <h2 style={{ marginTop: "40px" }}>Related Notes</h2>

          {notes.length === 0 && <p>No notes linked to this company.</p>}

          {notes.map((note) => (
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

              {note.contact && (
                <p>
                  Contact: {note.contact.first_name}{" "}
                  {note.contact.last_name || ""}
                </p>
              )}

              {note.opportunity && (
                <p>Opportunity: {note.opportunity.name}</p>
              )}

              {note.source && <p>Source: {note.source}</p>}
              {note.tags && <p>Tags: {note.tags}</p>}

              {note.created_at && (
                <p>Created: {new Date(note.created_at).toLocaleString()}</p>
              )}
            </Link>
          ))}

          <h2 style={{ marginTop: "40px" }}>Related Contacts</h2>

          {contacts.length === 0 && <p>No contacts linked to this company.</p>}

          {contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
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
                {contact.first_name} {contact.last_name || ""}
              </h3>

              {contact.title && <p>Title: {contact.title}</p>}
              {contact.email && <p>Email: {contact.email}</p>}
              {contact.phone && <p>Phone: {contact.phone}</p>}
            </Link>
          ))}

          <h2 style={{ marginTop: "40px" }}>Related Tasks</h2>

          {tasks.length === 0 && <p>No tasks linked to this company.</p>}

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
            <p>No activities linked to this company.</p>
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

              <p>
                Date: {new Date(activity.activity_date).toLocaleString()}
              </p>

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