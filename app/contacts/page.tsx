import Link from "next/link";
import { supabase } from "../lib/supabase";

type SupabaseRelation<T> = T | T[] | null;

type RelatedCompany = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_id: string | null;
  created_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archive_reason: string | null;
  companies: SupabaseRelation<RelatedCompany>;
};

type PageProps = {
  searchParams?: Promise<{
    archived?: string;
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

export default async function ContactsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const showArchived = resolvedSearchParams?.archived === "true";

  let query = supabase
    .from("contacts")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      title,
      company_id,
      created_at,
      is_archived,
      archived_at,
      archive_reason,
      companies (
        id,
        name
      )
    `);

  if (!showArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  const contacts = (data ?? []) as unknown as Contact[];

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
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Contacts</h1>

          <p style={{ color: "#aaa" }}>
            People connected to this Sell It workspace.
          </p>

          <p style={{ color: "#aaa", marginTop: "8px" }}>
            {showArchived
              ? "Showing active and archived contacts."
              : "Archived contacts are hidden by default."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "12px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Home
          </Link>

          <Link
            href={showArchived ? "/contacts" : "/contacts?archived=true"}
            style={{
              backgroundColor: showArchived ? "#dddddd" : "#f5d76e",
              color: "black",
              padding: "12px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Link>

          <Link
            href="/contacts/new"
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "12px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Add Contact
          </Link>
        </div>
      </div>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && contacts.length === 0 && (
        <p>{showArchived ? "No contacts found." : "No active contacts found."}</p>
      )}

      {contacts.map((contact) => {
        const company = singleRelation(contact.companies);

        return (
          <Link
            key={contact.id}
            href={`/contacts/${contact.id}`}
            style={{
              display: "block",
              border: contact.is_archived ? "1px solid #d6a400" : "1px solid #333",
              padding: "16px",
              marginBottom: "12px",
              borderRadius: "8px",
              backgroundColor: contact.is_archived ? "#211c0d" : "#1a1a1a",
              color: "white",
              textDecoration: "none",
            }}
          >
            {contact.is_archived && (
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "#f5d76e",
                  color: "black",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                ARCHIVED
              </div>
            )}

            <h2 style={{ marginTop: 0 }}>
              {contact.first_name} {contact.last_name || ""}
            </h2>

            {contact.title && <p>Title: {contact.title}</p>}
            {company?.name && <p>Company: {company.name}</p>}
            {contact.email && <p>Email: {contact.email}</p>}
            {contact.phone && <p>Phone: {contact.phone}</p>}

            {contact.is_archived && (
              <>
                <p>Archived: {formatDateTime(contact.archived_at)}</p>
                {contact.archive_reason && <p>Reason: {contact.archive_reason}</p>}
              </>
            )}
          </Link>
        );
      })}
    </main>
  );
}

