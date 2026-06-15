import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AttachmentsSection from "../../components/AttachmentsSection";

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

type RelatedOpportunity = {
  id: string;
  name: string;
};

type Note = {
  id: string;
  workspace_id: string;
  title: string;
  body: string | null;
  source: string | null;
  source_url: string | null;
  tags: string | null;
  created_at: string | null;
  company: SupabaseRelation<RelatedCompany>;
  contact: SupabaseRelation<RelatedContact>;
  opportunity: SupabaseRelation<RelatedOpportunity>;
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

export default async function NoteDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: noteRow, error } = await supabase
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

  const note = noteRow as unknown as Note | null;

  const company = singleRelation(note?.company);
  const contact = singleRelation(note?.contact);
  const opportunity = singleRelation(note?.opportunity);

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

        {note && (
          <Link
            href={`/notes/${note.id}/edit`}
            style={{
              color: "black",
              backgroundColor: "white",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Edit Note
          </Link>
        )}

        {note && (
          <Link
            href={`/notes/${note.id}/delete`}
            style={{
              color: "black",
              backgroundColor: "#ffdddd",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Delete Note
          </Link>
        )}
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
              <strong>Related Contact:</strong>{" "}
              {contact ? (
                <Link
                  href={`/contacts/${contact.id}`}
                  style={{ color: "white" }}
                >
                  {contact.first_name} {contact.last_name || ""}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Related Opportunity:</strong>{" "}
              {opportunity ? (
                <Link
                  href={`/opportunities/${opportunity.id}`}
                  style={{ color: "white" }}
                >
                  {opportunity.name}
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
              <strong>Created:</strong> {formatDateTime(note.created_at)}
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


