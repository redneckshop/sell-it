import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";

type Note = {
  id: string;
  workspace_id: string;
  title: string;
  body: string | null;
  source: string | null;
  source_url: string | null;
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

export default async function NoteDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: note, error } = await supabase
    .from("notes")
    .select(`
      id,
      workspace_id,
      title,
      body,
      source,
      source_url,
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
      ),
      opportunity:opportunities!notes_opportunity_id_fkey (
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

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
          href="/notes"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Notes
        </Link>
      </div>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {note && (
        <section style={{ marginTop: "32px" }}>
          <h1>{note.title}</h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "850px",
              marginBottom: "40px",
            }}
          >
            <p>
              <strong>Related Company:</strong>{" "}
              {note.company ? (
                <Link
                  href={`/companies/${note.company.id}`}
                  style={{ color: "white" }}
                >
                  {note.company.name}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Contact:</strong>{" "}
              {note.contact ? (
                <Link
                  href={`/contacts/${note.contact.id}`}
                  style={{ color: "white" }}
                >
                  {note.contact.first_name} {note.contact.last_name || ""}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Opportunity:</strong>{" "}
              {note.opportunity ? (
                <Link
                  href={`/opportunities/${note.opportunity.id}`}
                  style={{ color: "white" }}
                >
                  {note.opportunity.name}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Source:</strong> {note.source || "Not provided"}
            </p>

            <p>
              <strong>Source URL:</strong>{" "}
              {note.source_url ? (
                <a
                  href={note.source_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "white" }}
                >
                  {note.source_url}
                </a>
              ) : (
                "Not provided"
              )}
            </p>

            <p>
              <strong>Tags:</strong> {note.tags || "Not provided"}
            </p>

            <p>
              <strong>Body:</strong>
            </p>

            <p style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
              {note.body || "No body provided."}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {note.created_at
                ? new Date(note.created_at).toLocaleString()
                : "Not available"}
            </p>
          </div>

          <AttachmentsSection
            workspaceId={note.workspace_id}
            relationColumn="related_note_id"
            relationId={note.id}
          />
        </section>
      )}
    </main>
  );
}