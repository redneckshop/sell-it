import Link from "next/link";
import type { CSSProperties } from "react";
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

const primaryButtonStyle: CSSProperties = {
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  border: "1px solid rgba(168, 85, 247, 0.55)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  boxShadow: "0 16px 40px rgba(124, 58, 237, 0.28)",
};

const dangerButtonStyle: CSSProperties = {
  color: "#fecaca",
  background: "rgba(127, 29, 29, 0.24)",
  border: "1px solid rgba(248, 113, 113, 0.35)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
};

const headerStyle: CSSProperties = {
  maxWidth: "1080px",
  marginBottom: "24px",
  border: "1px solid rgba(124, 58, 237, 0.22)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
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
  marginBottom: "16px",
  maxWidth: "1080px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.22)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const metaCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: "16px",
  padding: "14px",
  background: "rgba(15, 23, 42, 0.55)",
};

const metaLabelStyle: CSSProperties = {
  margin: "0 0 6px",
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const metaValueStyle: CSSProperties = {
  margin: 0,
  color: "#f8fafc",
  fontWeight: 800,
};

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 900,
  textDecoration: "none",
};

const bodyStyle: CSSProperties = {
  whiteSpace: "pre-wrap",
  color: "#e2e8f0",
  lineHeight: 1.7,
  marginTop: "8px",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginTop: "18px",
  maxWidth: "1080px",
  fontWeight: 800,
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
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href="/notes" style={secondaryButtonStyle}>
          Back to Notes
        </Link>

        {note && (
          <Link href={`/notes/${note.id}/edit`} style={primaryButtonStyle}>
            Edit Note
          </Link>
        )}

        {note && (
          <Link href={`/notes/${note.id}/delete`} style={dangerButtonStyle}>
            Delete Note
          </Link>
        )}
      </div>

      {error && <div style={errorStyle}>Database error: {error.message}</div>}

      {note && (
        <>
          <header style={headerStyle}>
            <p style={eyebrowStyle}>Sales Memory</p>

            <h1 style={titleStyle}>{note.title}</h1>

            <p style={mutedTextStyle}>
              Review the note body, source details, tags, related records, and
              attachments connected to this note.
            </p>
          </header>

          <section style={cardStyle}>
            <div style={gridStyle}>
              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Related Company</p>
                <p style={metaValueStyle}>
                  {company ? (
                    <Link href={`/companies/${company.id}`} style={linkStyle}>
                      {company.name}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Related Contact</p>
                <p style={metaValueStyle}>
                  {contact ? (
                    <Link href={`/contacts/${contact.id}`} style={linkStyle}>
                      {contact.first_name} {contact.last_name || ""}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Related Opportunity</p>
                <p style={metaValueStyle}>
                  {opportunity ? (
                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      style={linkStyle}
                    >
                      {opportunity.name}
                    </Link>
                  ) : (
                    "Not linked"
                  )}
                </p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Created</p>
                <p style={metaValueStyle}>{formatDateTime(note.created_at)}</p>
              </div>
            </div>

            <div style={gridStyle}>
              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Source</p>
                <p style={metaValueStyle}>{note.source || "Not provided"}</p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Source URL</p>
                <p style={metaValueStyle}>
                  {note.source_url ? (
                    <a
                      href={note.source_url}
                      target="_blank"
                      rel="noreferrer"
                      style={linkStyle}
                    >
                      Open Source
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </p>
              </div>

              <div style={metaCardStyle}>
                <p style={metaLabelStyle}>Tags</p>
                <p style={metaValueStyle}>{note.tags || "Not provided"}</p>
              </div>
            </div>

            <section style={{ marginTop: "18px" }}>
              <h2 style={{ marginBottom: 0 }}>Body</h2>
              <p style={bodyStyle}>{note.body || "No body provided."}</p>
            </section>
          </section>

          <AttachmentsSection
            workspaceId={note.workspace_id}
            relationColumn="related_note_id"
            relationId={note.id}
          />
        </>
      )}
    </main>
  );
}