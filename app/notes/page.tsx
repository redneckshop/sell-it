import Link from "next/link";
import { supabase } from "../lib/supabase";

type Note = {
  id: string;
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

  const notes: Note[] = data ?? [];

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

      {notes.map((note) => (
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
            <p style={{ color: "#aaa" }}>
              {note.body.length > 180
                ? `${note.body.slice(0, 180)}...`
                : note.body}
            </p>
          )}

          {note.company && <p>Company: {note.company.name}</p>}

          {note.contact && (
            <p>
              Contact: {note.contact.first_name} {note.contact.last_name || ""}
            </p>
          )}

          {note.opportunity && <p>Opportunity: {note.opportunity.name}</p>}

          {note.source && <p>Source: {note.source}</p>}

          {note.tags && <p>Tags: {note.tags}</p>}

          {note.created_at && (
            <p>Created: {new Date(note.created_at).toLocaleString()}</p>
          )}
        </Link>
      ))}
    </main>
  );
}