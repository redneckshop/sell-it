import Link from "next/link";
import type { CSSProperties } from "react";
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

  if (value.length > 140) {
    return `${value.slice(0, 140)}...`;
  }

  return value;
}

function initialsFromTitle(title: string) {
  const parts = title
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function contactName(contact: RelatedContact | null) {
  if (!contact) return "Not linked";

  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function pageStyle(): CSSProperties {
  return {
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#101010",
    color: "white",
    padding: "clamp(12px, 4vw, 38px)",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  };
}

function panelStyle(): CSSProperties {
  return {
    border: "1px solid #2f2f2f",
    background:
      "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
    padding: "16px",
    borderRadius: "14px",
    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
  };
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #3d3d3d",
    backgroundColor: "#111",
    color: "white",
    outline: "none",
  };
}

function fieldLabelStyle(): CSSProperties {
  return {
    display: "block",
    marginBottom: "7px",
    color: "#e5e5e5",
    fontSize: "13px",
    fontWeight: 800,
  };
}

function primaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    backgroundColor: "#7c3aed",
    color: "white",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #8b5cf6",
    boxShadow: "0 12px 24px rgba(124,58,237,0.24)",
  };
}

function secondaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    color: "white",
    border: "1px solid #3d3d3d",
    backgroundColor: "#151515",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
  };
}

function badgeStyle(value: string | null): CSSProperties {
  const normalized = (value ?? "").toLowerCase();

  const backgroundColor =
    normalized.includes("capture") || normalized.includes("assistant")
      ? "rgba(124, 58, 237, 0.22)"
      : normalized.includes("email")
        ? "rgba(59, 130, 246, 0.22)"
        : normalized.includes("call") || normalized.includes("meeting")
          ? "rgba(34, 197, 94, 0.18)"
          : "rgba(156, 163, 175, 0.18)";

  const color =
    normalized.includes("capture") || normalized.includes("assistant")
      ? "#c4b5fd"
      : normalized.includes("email")
        ? "#93c5fd"
        : normalized.includes("call") || normalized.includes("meeting")
          ? "#86efac"
          : "#d1d5db";

  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor,
    color,
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
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
    <main style={pageStyle()}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "22px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                ...mutedTextStyle(),
                textTransform: "uppercase",
                letterSpacing: "1.8px",
                fontSize: "12px",
                fontWeight: 900,
                margin: "0 0 8px",
              }}
            >
              Sales
            </p>

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>Notes</h1>

            <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.5 }}>
              Notes connected to companies, contacts, and opportunities.
            </p>
          </div>

          <Link href="/notes/new" style={primaryButtonStyle()}>
            + Add Note
          </Link>
        </div>

        <form action="/notes" style={{ ...panelStyle(), marginBottom: "18px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <label>
              <span style={fieldLabelStyle()}>Search</span>
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search notes..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Source</span>
              <input
                name="source"
                defaultValue={params.source ?? ""}
                placeholder="Call, meeting, capture..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Tags</span>
              <input
                name="tags"
                defaultValue={params.tags ?? ""}
                placeholder="Search tags..."
                style={inputStyle()}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px",
            }}
          >
            <button
              type="submit"
              style={{
                ...primaryButtonStyle(),
                cursor: "pointer",
              }}
            >
              Apply Filters
            </button>

            <a href="/notes" style={secondaryButtonStyle()}>
              Clear Filters
            </a>
          </div>
        </form>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <p style={{ ...mutedTextStyle(), margin: 0 }}>{resultCountLabel}</p>

          <p style={{ ...mutedTextStyle(), margin: 0, fontSize: "13px" }}>
            Sorted by newest first
          </p>
        </div>

        {error && (
          <p style={{ color: "red" }}>Database error: {error.message}</p>
        )}

        {!error && allNotes.length === 0 && <p>No notes found.</p>}

        {!error && allNotes.length > 0 && notes.length === 0 && (
          <p>No notes match the current filters.</p>
        )}

        <div style={{ display: "grid", gap: "10px" }}>
          {notes.map((note) => {
            const company = singleRelation(note.company);
            const contact = singleRelation(note.contact);
            const opportunity = singleRelation(note.opportunity);

            return (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "48px minmax(0, 1.25fr) minmax(190px, 0.85fr) 26px",
                  gap: "14px",
                  alignItems: "center",
                  border: "1px solid #2f2f2f",
                  padding: "14px",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
                  color: "white",
                  textDecoration: "none",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#2b2b2b",
                    color: "white",
                    fontWeight: 900,
                    border: "1px solid #3d3d3d",
                  }}
                >
                  {initialsFromTitle(note.title)}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginBottom: "5px",
                    }}
                  >
                    <strong>{note.title}</strong>

                    {note.source && (
                      <span style={badgeStyle(note.source)}>{note.source}</span>
                    )}

                    {note.tags && <span style={badgeStyle(note.tags)}>Tags</span>}
                  </div>

                  {note.body && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "0 0 8px",
                        lineHeight: 1.4,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {previewText(note.body)}
                    </p>
                  )}

                  <p style={{ ...mutedTextStyle(), margin: "0 0 4px" }}>
                    Company: {company?.name || "Not linked"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: 0 }}>
                    Contact: {contactName(contact)}
                  </p>
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Opportunity: {opportunity?.name || "Not linked"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Created: {formatDateTime(note.created_at)}
                  </p>

                  {note.source_url && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: 0,
                        overflowWrap: "anywhere",
                      }}
                    >
                      Source URL: {note.source_url}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    color: "#a7a7a7",
                    fontSize: "26px",
                    textAlign: "right",
                  }}
                >
                  ›
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

