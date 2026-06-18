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

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    source?: string;
    tags?: string;
  }>;
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function textValue(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function includesText(value: string | null | undefined, search: string) {
  if (!search) return true;

  return textValue(value).includes(search);
}

function matchesNoteSearch(note: Note, search: string) {
  if (!search) return true;

  const company = singleRelation(note.company);
  const contact = singleRelation(note.contact);
  const opportunity = singleRelation(note.opportunity);

  const searchable = [
    note.title,
    note.body,
    note.source,
    note.source_url,
    note.tags,
    company?.name,
    contact?.first_name,
    contact?.last_name,
    opportunity?.name,
  ]
    .map((value) => textValue(value))
    .join(" ");

  return searchable.includes(search);
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

export default async function NotesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const search = (params.q ?? "").trim().toLowerCase();
  const sourceSearch = (params.source ?? "").trim().toLowerCase();
  const tagsSearch = (params.tags ?? "").trim().toLowerCase();

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

  const allNotes = (data ?? []) as unknown as Note[];

  const notes = allNotes.filter((note) => {
    return (
      matchesNoteSearch(note, search) &&
      includesText(note.source, sourceSearch) &&
      includesText(note.tags, tagsSearch)
    );
  });

  const hasFilters = Boolean(search) || Boolean(sourceSearch) || Boolean(tagsSearch);

  const resultCountLabel = `Showing ${notes.length} notes out of ${allNotes.length} total notes${
    hasFilters ? " with current filters" : ""
  }`;

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

      <p style={{ color: "#aaa", marginBottom: "24px" }}>
        Notes connected to companies, contacts, and opportunities.
      </p>

      <form
        action="/notes"
        style={{
          border: "1px solid #333",
          backgroundColor: "#181818",
          padding: "16px",
          borderRadius: "10px",
          marginBottom: "18px",
          display: "grid",
          gap: "12px",
          maxWidth: "900px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Search
            </span>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Keyword"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Source
            </span>
            <input
              name="source"
              defaultValue={params.source ?? ""}
              placeholder="Call, meeting, capture..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Tags
            </span>
            <input
              name="tags"
              defaultValue={params.tags ?? ""}
              placeholder="Tags"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#f5d76e",
              color: "black",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>

          <a
            href="/notes"
            style={{
              color: "white",
              border: "1px solid #555",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Clear Filters
          </a>
        </div>
      </form>

      <p style={{ color: "#aaa", marginBottom: "18px" }}>
        {resultCountLabel}
      </p>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && allNotes.length === 0 && <p>No notes found.</p>}

      {!error && allNotes.length > 0 && notes.length === 0 && (
        <p>No notes match the current filters.</p>
      )}

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
