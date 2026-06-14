import Link from "next/link";
import { supabase } from "../lib/supabase";

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

function previewText(value: string | null) {
  if (!value) return "";

  if (value.length > 180) {
    return `${value.slice(0, 180)}...`;
  }

  return value;
}

export default async function NotesPage() {
  const { data, error } = await supabase
    .from("notes")
    .select(`
      id,
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
    .order("created_at", { ascending: false });

  const notes = (data ?? []) as unknown as Note[];

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
          href="/notes/new"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Note
        </Link>
      </div>

      <h1>Notes</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Notes connected to companies, contacts, and opportunities.
      </p>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && notes.length === 0 && <p>No notes found.</p>}

      {notes.map((note) => {
        const company = singleRelation(note.company);
        const contact = singleRelation(note.contact);
        const opportunity = singleRelation(note.opportunity);

        return (
          <Link
            key={note.id}
            href={`/notes/${note.id}`}
            style={{
              display: "block",
              border: "1px solid #333",
              padding: "18px",
              marginBottom: "12px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              color: "white",
              textDecoration: "none",
              maxWidth: "900px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{note.title}</h2>

            {note.body && (
              <p style={{ color: "#aaa" }}>{previewText(note.body)}</p>
            )}

            {company && <p>Company: {company.name}</p>}

            {contact && (
              <p>
                Contact: {contact.first_name} {contact.last_name || ""}
              </p>
            )}

            {opportunity && <p>Opportunity: {opportunity.name}</p>}

            {note.source && <p>Source: {note.source}</p>}
            {note.tags && <p>Tags: {note.tags}</p>}

            {note.created_at && <p>Created: {formatDateTime(note.created_at)}</p>}
          </Link>
        );
      })}
    </main>
  );
}