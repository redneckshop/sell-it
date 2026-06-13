import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Opportunity = {
  id: string;
  name: string;
  opportunity_type: string;
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
  companies: {
    id: string;
    name: string;
  } | null;
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
  company: {
    id: string;
    name: string;
  } | null;
  contact: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .select(`
      id,
      name,
      opportunity_type,
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

  const relatedNotes: Note[] = noteRows ?? [];

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
      </div>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {opportunity && (
        <section style={{ marginTop: "32px" }}>
          <h1>{opportunity.name}</h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "800px",
              marginBottom: "40px",
            }}
          >
            <p>
              <strong>Company:</strong>{" "}
              {opportunity.companies ? (
                <Link
                  href={`/companies/${opportunity.companies.id}`}
                  style={{ color: "white" }}
                >
                  {opportunity.companies.name}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Primary Contact:</strong>{" "}
              {opportunity.primary_contact ? (
                <Link
                  href={`/contacts/${opportunity.primary_contact.id}`}
                  style={{ color: "white" }}
                >
                  {opportunity.primary_contact.first_name}{" "}
                  {opportunity.primary_contact.last_name || ""}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Opportunity Type:</strong>{" "}
              {opportunity.opportunity_type}
            </p>

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
              {opportunity.created_at
                ? new Date(opportunity.created_at).toLocaleString()
                : "Not available"}
            </p>
          </div>

          <h2>Related Notes</h2>

          {relatedNotes.length === 0 && (
            <p>No notes linked to this opportunity.</p>
          )}

          {relatedNotes.map((note) => (
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

              {note.company && <p>Company: {note.company.name}</p>}

              {note.contact && (
                <p>
                  Contact: {note.contact.first_name}{" "}
                  {note.contact.last_name || ""}
                </p>
              )}

              {note.source && <p>Source: {note.source}</p>}
              {note.tags && <p>Tags: {note.tags}</p>}

              {note.created_at && (
                <p>Created: {new Date(note.created_at).toLocaleString()}</p>
              )}
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}